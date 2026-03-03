'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { BADGE_RULES, SUBJECTS } from '@/lib/curriculum';
import {
  computeBadges,
  exportData,
  getLevel,
  initialState,
  loadState,
  recomputeSubjectMastery,
  saveState,
  updateStreak,
  weeklyCompletionCount,
} from '@/lib/storage';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const SUBJECT_KEYS = Object.keys(SUBJECTS);
const SESSION_MINUTES = 30;

function getConcept(subjectKey, unitIndex, conceptIndex) {
  const subject = SUBJECTS[subjectKey];
  const unit = subject?.units?.[unitIndex] || subject?.units?.[0];
  return {
    subject,
    unit,
    concept: unit?.concepts?.[conceptIndex] || unit?.concepts?.[0],
  };
}

function recommendation(state) {
  return SUBJECT_KEYS.map((k) => ({ key: k, mastery: state.subjects[k]?.mastery || 0 }))
    .sort((a, b) => a.mastery - b.mastery)[0]?.key || 'math';
}

function parseNumber(v) {
  const n = Number(String(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export default function HomePage() {
  const [state, setState] = useState(initialState);
  const [tab, setTab] = useState('dashboard');
  const [sessionSubject, setSessionSubject] = useState('math');
  const [sessionActive, setSessionActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_MINUTES * 60);
  const [phase, setPhase] = useState('idle');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [tutorText, setTutorText] = useState('');
  const [summary, setSummary] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => setState(loadState()), []);
  useEffect(() => saveState(state), [state]);

  useEffect(() => {
    if (!sessionActive) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          completeSession(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive]);

  useEffect(() => {
    const weeklyCompleted = weeklyCompletionCount(state.sessionLogs);
    const streak = updateStreak(state.lastCompletionDate, state.sessionLogs);
    const badges = computeBadges({ ...state, weeklyCompleted, streak });
    if (weeklyCompleted !== state.weeklyCompleted || streak !== state.streak || JSON.stringify(badges) !== JSON.stringify(state.badges)) {
      setState((prev) => ({ ...prev, weeklyCompleted, streak, badges }));
    }
  }, [state.sessionLogs]);

  const totalMastery = useMemo(() => Math.round(SUBJECT_KEYS.reduce((a, k) => a + (state.subjects[k]?.mastery || 0), 0) / SUBJECT_KEYS.length), [state.subjects]);
  const level = getLevel(totalMastery);
  const suggested = recommendation(state);

  const { subject, unit, concept } = getConcept(
    sessionSubject,
    state.subjects[sessionSubject]?.currentUnitIndex || 0,
    state.subjects[sessionSubject]?.currentConceptIndex || 0
  );

  const baseQuestions = concept?.questions || [];
  const questions = useMemo(() => {
    const q = baseQuestions.map((x) => ({ ...x, type: x.type || 'multiple_choice' }));
    if (sessionSubject === 'math' && q.length) {
      const n = parseNumber(q[0].answer);
      if (n !== null) q.push({ type: 'numeric_input', prompt: `Type the numeric answer: ${q[0].prompt}`, answer: String(n), explanation: 'Focus on the number only.' });
    }
    if (q.length) {
      q.push({
        type: 'free_text',
        prompt: `In 1-2 sentences, explain the key idea of: ${concept?.title}`,
        sample_answer: concept?.explanation?.slice(0, 120) || '',
        rubric: 'Student should mention the main concept accurately in simple language.',
      });
    }
    return q;
  }, [concept?.id, sessionSubject]);

  async function askTutor(message, phaseName = phase) {
    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: sessionSubject,
        unitIndex: state.subjects[sessionSubject].currentUnitIndex,
        conceptIndex: state.subjects[sessionSubject].currentConceptIndex,
        phase: phaseName,
        message,
      }),
    });
    const data = await res.json();
    setTutorText(data.reply || 'Let\'s keep going.');
  }

  async function gradeCurrentQuestion() {
    const q = questions[questionIndex];
    if (!q) return;
    let isCorrect = false;

    if (q.type === 'multiple_choice') {
      isCorrect = inputValue === q.answer;
    } else if (q.type === 'numeric_input') {
      const a = parseNumber(inputValue);
      const b = parseNumber(q.answer);
      isCorrect = a !== null && b !== null && Math.abs(a - b) <= 0.01;
    } else {
      const resp = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'grade_free_text',
          subject: subject.name,
          conceptTitle: concept.title,
          prompt: q.prompt,
          rubric: q.rubric,
          expectedAnswer: q.sample_answer,
          studentAnswer: inputValue,
        }),
      }).then((r) => r.json());
      isCorrect = !!resp.correct;
      setTutorText(resp.feedback || 'Nice effort.');
    }

    const nextAnswers = [...answers, { prompt: q.prompt, correct: isCorrect, answer: inputValue, type: q.type }];
    setAnswers(nextAnswers);
    if (isCorrect) setCorrect((v) => v + 1);

    if (!isCorrect && q.type !== 'free_text') {
      await askTutor(`I got this wrong: ${q.prompt}. My answer: ${inputValue}`, 'reteach');
    }

    setInputValue('');
    if (questionIndex + 1 >= questions.length) {
      completeSession(false, nextAnswers, isCorrect ? correct + 1 : correct);
    } else {
      setQuestionIndex((i) => i + 1);
    }
  }

  async function startSession(subjectKey = suggested) {
    setSessionSubject(subjectKey);
    setTab('session');
    setSessionActive(true);
    setSecondsLeft(SESSION_MINUTES * 60);
    setPhase('introduction');
    setQuestionIndex(0);
    setCorrect(0);
    setAnswers([]);
    setSummary(null);
    await askTutor('Introduce today\'s concept before we practice.', 'introduction');
  }

  async function beginQuestions() {
    setPhase('independent_practice');
    if (!tutorText) await askTutor('Let\'s begin the first question.', 'independent_practice');
  }

  function completeSession(auto = false, finalAnswers = answers, finalCorrect = correct) {
    const asked = finalAnswers.length;
    const score = asked ? Math.round((finalCorrect / asked) * 100) : 0;
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const minutesCompleted = Math.max(1, Math.round((SESSION_MINUTES * 60 - secondsLeft) / 60));
    const isMastered = score >= 90;

    setState((prev) => {
      const next = structuredClone(prev);
      const subj = next.subjects[sessionSubject];
      const c = concept;
      const cp = subj.conceptMap[c.id] || { status: 'not_started', attempts: 0, bestScore: 0, timeSpent: 0, title: c.title, unit: unit.title };
      cp.attempts += 1;
      cp.lastScore = score;
      cp.bestScore = Math.max(cp.bestScore || 0, score);
      cp.lastPracticed = now.toISOString();
      cp.timeSpent = (cp.timeSpent || 0) + minutesCompleted * 60;
      cp.status = isMastered ? 'mastered' : cp.attempts > 1 ? 'struggling' : 'in_progress';
      subj.conceptMap[c.id] = cp;

      if (isMastered && !subj.conceptsCompleted.includes(c.id)) subj.conceptsCompleted.push(c.id);
      if (isMastered) {
        const nextConcept = subj.currentConceptIndex + 1;
        if (subject.units[subj.currentUnitIndex]?.concepts?.[nextConcept]) subj.currentConceptIndex = nextConcept;
        else if (subject.units[subj.currentUnitIndex + 1]) {
          subj.currentUnitIndex += 1;
          subj.currentConceptIndex = 0;
        }
      }
      subj.timeSpent += minutesCompleted;
      subj.mastery = recomputeSubjectMastery(subj);

      next.totalMinutes += minutesCompleted;
      next.lastCompletionDate = date;
      next.sessionLogs.unshift({
        date,
        duration: minutesCompleted,
        subject: sessionSubject,
        conceptId: c.id,
        conceptTitle: c.title,
        score,
        mastered: isMastered,
        auto,
      });
      return next;
    });

    if (isMastered) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2400);
    }

    setSummary({
      score,
      mastered: isMastered,
      streak: state.streak,
      time: minutesCompleted,
      concept: concept.title,
    });
    setSessionActive(false);
    setPhase('summary');
  }

  const currentQ = questions[questionIndex];

  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [{ label: 'Completed', data: Array.from({ length: 5 }, (_, i) => (i < state.weeklyCompleted ? 1 : 0)), backgroundColor: '#F59E0B', borderRadius: 8 }],
  };

  return (
    <main className="container fadeIn">
      {showConfetti && <div className="confetti">✨ 🎉 ✨</div>}
      <header className="header">
        <div>
          <h1>Alpha Learning</h1>
          <p>Raleigh&apos;s Daily 30</p>
        </div>
        <div className="level">{level.name} · {totalMastery}% mastery</div>
      </header>

      <nav className="tabs">
        {['dashboard', 'session', 'progress', 'parent'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? 'active' : ''}>{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </nav>

      {tab === 'dashboard' && (
        <section className="grid two">
          <article className="card hero">
            <h2>Recommended Today: {SUBJECTS[suggested].name}</h2>
            <p>Smart pick based on weakest subject. You can override anytime.</p>
            <div className="actions">
              <button className="primary" onClick={() => startSession(suggested)}>Start Recommended</button>
              <select value={sessionSubject} onChange={(e) => setSessionSubject(e.target.value)}>
                {SUBJECT_KEYS.map((k) => <option key={k} value={k}>{SUBJECTS[k].name}</option>)}
              </select>
              <button className="secondary" onClick={() => startSession(sessionSubject)}>Start Chosen Subject</button>
            </div>
            <div className="stats"><span>🔥 {state.streak} day streak</span><span>{state.weeklyCompleted}/5 this week</span><span>{state.totalMinutes} mins</span></div>
          </article>

          <article className="card"><h3>Weekly Progress</h3><Bar data={weeklyData} options={{ plugins: { legend: { display: false } }, scales: { y: { display: false, max: 1 } } }} /></article>

          <article className="card span2">
            <h3>Subject Mastery</h3>
            <div className="rings">
              {SUBJECT_KEYS.map((k) => (
                <div className="ringWrap" key={k}>
                  <Doughnut data={{ labels: ['Mastery', 'Remaining'], datasets: [{ data: [state.subjects[k]?.mastery || 0, 100 - (state.subjects[k]?.mastery || 0)], backgroundColor: ['#f59e0b', '#fde68a'], borderWidth: 0 }] }} options={{ plugins: { legend: { display: false } }, cutout: '72%' }} />
                  <div className="ringLabel"><strong>{state.subjects[k]?.mastery || 0}%</strong><small>{SUBJECTS[k].name}</small></div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {tab === 'session' && (
        <section className="grid two ipad-session">
          <article className="card">
            <h2>{SUBJECTS[sessionSubject].emoji} {subject?.name}</h2>
            <p><strong>{unit?.title}</strong> · {concept?.title}</p>
            {phase === 'introduction' && (
              <>
                <h3>Concept First</h3>
                <p>{concept?.explanation}</p>
                <button className="primary" onClick={beginQuestions}>Start Questions</button>
              </>
            )}
            {phase !== 'introduction' && phase !== 'summary' && currentQ && (
              <div className="questionCard">
                <h3>Question {questionIndex + 1}/{questions.length}</h3>
                <p>{currentQ.prompt}</p>
                {currentQ.type === 'multiple_choice' && (
                  <div className="quickReplies">
                    {currentQ.choices.map((c) => (
                      <button key={c} className={inputValue === c ? 'selected' : ''} onClick={() => setInputValue(c)}>{c}</button>
                    ))}
                  </div>
                )}
                {currentQ.type === 'numeric_input' && (
                  <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Type number" />
                )}
                {currentQ.type === 'free_text' && (
                  <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} rows={4} placeholder="Type a short explanation" />
                )}
                <button className="primary" disabled={!inputValue.trim()} onClick={gradeCurrentQuestion}>Submit</button>
              </div>
            )}
            {phase === 'summary' && summary && (
              <div className="summaryBox">
                <h3>Session Summary</h3>
                <p><strong>Concept:</strong> {summary.concept}</p>
                <p><strong>Score:</strong> {summary.score}% {summary.mastered ? '✅ Mastered' : '🔁 In Progress'}</p>
                <p><strong>Time spent:</strong> {summary.time} minutes</p>
                <p><strong>Streak:</strong> 🔥 {state.streak} days</p>
              </div>
            )}
          </article>

          <article className="card chat">
            <h3>AI Tutor</h3>
            <div className="bubble assistant">{tutorText || 'Tap start to get concept coaching.'}</div>
            <div className="quickReplies">
              <button onClick={() => askTutor('Explain this concept in a different way.', phase)}>Explain differently</button>
              <button onClick={() => askTutor('Give me a real-world example.', phase)}>Real-world example</button>
              <button onClick={() => askTutor('What did I miss?', 'reteach')}>Review misses</button>
            </div>
          </article>

          <div className="timerCorner">{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</div>
        </section>
      )}

      {tab === 'progress' && (
        <section className="grid two">
          {SUBJECT_KEYS.map((k) => {
            const conceptEntries = Object.entries(state.subjects[k].conceptMap || {});
            const struggling = conceptEntries.filter(([, v]) => v.status === 'struggling');
            return (
              <article key={k} className="card">
                <h3>{SUBJECTS[k].emoji} {SUBJECTS[k].name} — {state.subjects[k].mastery}%</h3>
                <p>Mastered: {conceptEntries.filter(([, v]) => v.status === 'mastered').length}/{conceptEntries.length}</p>
                <details>
                  <summary>Per-concept drill-down</summary>
                  <ul>
                    {conceptEntries.slice(0, 18).map(([id, c]) => <li key={id}>{c.title} · {c.status} · best {c.bestScore || 0}% ({c.attempts} attempts)</li>)}
                  </ul>
                </details>
                {struggling.length > 0 && <p className="warn">Struggling: {struggling.slice(0, 3).map(([, c]) => c.title).join(', ')}</p>}
              </article>
            );
          })}
        </section>
      )}

      {tab === 'parent' && (
        <section className="grid two">
          <article className="card span2">
            <h2>Parent Dashboard</h2>
            <p>Overall mastery: <strong>{totalMastery}%</strong> · Weekly goal: <strong>{state.weeklyCompleted}/5</strong></p>
            <Bar data={weeklyData} options={{ plugins: { legend: { display: false } }, scales: { y: { display: false, max: 1 } } }} />
            <button className="secondary" onClick={() => exportData(state)}>Export JSON</button>
          </article>
          <article className="card">
            <h3>Badges</h3>
            <ul>{BADGE_RULES.filter((b) => state.badges.includes(b.id)).map((b) => <li key={b.id}>{b.title}</li>)}</ul>
          </article>
          <article className="card">
            <h3>Recent Sessions</h3>
            <ul>{state.sessionLogs.slice(0, 8).map((l, i) => <li key={i}>{l.date} · {SUBJECTS[l.subject]?.name} · {l.conceptTitle} · {l.score}%</li>)}</ul>
          </article>
        </section>
      )}
    </main>
  );
}
