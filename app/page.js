'use client';

import { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { SUBJECTS } from '@/lib/curriculum';
import {
  computeBadges,
  computeStreakState,
  exportData,
  getLevel,
  hydrateStateFromSupabase,
  initialState,
  loadState,
  recomputeSubjectMastery,
  saveState,
  syncStateToSupabase,
  weeklyCompletionCount,
} from '@/lib/storage';

const SUBJECT_KEYS = Object.keys(SUBJECTS);
const SESSION_MINUTES = 30;
const QUESTIONS_PER_CONCEPT = 5;
const CONCEPTS_PER_SESSION = 3;
const AVATARS = ['🦊', '🐼', '🐯', '🦄'];

function playSuccessTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    gain.gain.value = 0.03;
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {}
}

function recommendation(state) {
  return SUBJECT_KEYS.map((k) => ({ key: k, mastery: state.subjects[k]?.mastery || 0 }))
    .sort((a, b) => a.mastery - b.mastery)[0]?.key || state.profile?.startSubject || 'math';
}

function conceptSequence(subjectKey, state) {
  const subject = SUBJECTS[subjectKey];
  if (!subject) return [];

  const startUnit = state.subjects[subjectKey]?.currentUnitIndex || 0;
  const startConcept = state.subjects[subjectKey]?.currentConceptIndex || 0;
  const list = [];

  subject.units.forEach((unit, uIdx) => {
    unit.concepts.forEach((concept, cIdx) => {
      list.push({
        subjectKey,
        unitIndex: uIdx,
        conceptIndex: cIdx,
        unitTitle: unit.title,
        concept,
      });
    });
  });

  const startFlatIndex = subject.units.slice(0, startUnit).reduce((a, u) => a + u.concepts.length, 0) + startConcept;
  const rotated = [...list.slice(startFlatIndex), ...list.slice(0, startFlatIndex)];
  return rotated.slice(0, CONCEPTS_PER_SESSION);
}

export default function HomePage() {
  const [state, setState] = useState(initialState);
  const [tab, setTab] = useState('dashboard');
  const [sessionSubject, setSessionSubject] = useState('math');
  const [sessionActive, setSessionActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_MINUTES * 60);
  const [sessionPlan, setSessionPlan] = useState([]);
  const [conceptCursor, setConceptCursor] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState('');
  const [conceptCorrect, setConceptCorrect] = useState(0);
  const [conceptAnswers, setConceptAnswers] = useState([]);
  const [conceptSummary, setConceptSummary] = useState(null);
  const [sessionResults, setSessionResults] = useState([]);
  const [summary, setSummary] = useState(null);

  const suggested = recommendation(state);
  const currentArc = sessionPlan[conceptCursor];
  const currentQ = questions[questionIndex];

  useEffect(() => {
    let mounted = true;
    (async () => {
      const local = loadState();
      const hydrated = await hydrateStateFromSupabase(local);
      if (mounted) setState(hydrated);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    saveState(state);
    syncStateToSupabase(state);
  }, [state]);

  useEffect(() => {
    if (!sessionActive) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setSessionActive(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionActive]);

  useEffect(() => {
    const weeklyCompleted = weeklyCompletionCount(state.sessionLogs);
    const streakInfo = computeStreakState(state.sessionLogs, state.freezeDaysPerWeek);
    const badges = computeBadges({ ...state, weeklyCompleted, streak: streakInfo.currentStreak });
    const hasCompletedToday = state.sessionLogs[0]?.date === new Date().toISOString().slice(0, 10);
    const parentStatus = hasCompletedToday ? `${state.profile.name || 'Raleigh'} completed today ✅` : 'Not yet started ⏳';

    setState((prev) => ({
      ...prev,
      weeklyCompleted,
      streak: streakInfo.currentStreak,
      longestStreak: Math.max(prev.longestStreak || 0, streakInfo.longestStreak || 0),
      freezeUsageByWeek: streakInfo.freezeUsageByWeek,
      freezeDaysUsedThisWeek: streakInfo.freezeDaysUsedThisWeek,
      badges,
      hasCompletedToday,
      parentStatus,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionLogs.length]);

  const totalMastery = useMemo(() => Math.round(SUBJECT_KEYS.reduce((a, k) => a + (state.subjects[k]?.mastery || 0), 0) / SUBJECT_KEYS.length), [state.subjects]);
  const level = getLevel(totalMastery);

  async function loadQuestions(arc, previousQuestions = []) {
    const res = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: arc.subjectKey,
        unit: arc.unitTitle,
        concept: arc.concept.title,
        difficulty: 'grade_5',
        count: QUESTIONS_PER_CONCEPT,
        previousQuestions,
      }),
    });
    const data = await res.json();
    return (data.questions || []).slice(0, QUESTIONS_PER_CONCEPT);
  }

  async function startSession(subjectKey = suggested) {
    const plan = conceptSequence(subjectKey, state);
    if (!plan.length) return;

    const firstQuestions = await loadQuestions(plan[0]);

    setSessionSubject(subjectKey);
    setSessionPlan(plan);
    setConceptCursor(0);
    setQuestions(firstQuestions);
    setQuestionIndex(0);
    setConceptCorrect(0);
    setConceptAnswers([]);
    setConceptSummary(null);
    setSessionResults([]);
    setSummary(null);
    setInputValue('');
    setFeedback('');
    setSecondsLeft(SESSION_MINUTES * 60);
    setSessionActive(true);
    setTab('session');
  }

  async function gradeQuestion() {
    if (!currentQ || !inputValue.trim()) return;

    let score = 0;
    let isCorrect = false;
    let feedbackText = '';

    if (currentQ.type === 'multiple_choice') {
      isCorrect = inputValue === currentQ.correctAnswer;
      score = isCorrect ? 100 : 0;
      feedbackText = isCorrect ? 'Nice! You got it right.' : `Good try. Correct answer: ${currentQ.correctAnswer}`;
    } else {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          correctAnswer: currentQ.correctAnswer,
          studentAnswer: inputValue,
          subject: sessionSubject,
          concept: currentArc?.concept?.title,
        }),
      });
      const graded = await res.json();
      isCorrect = Boolean(graded.correct);
      score = Number(graded.score) || 0;
      feedbackText = graded.feedback || 'Nice effort — keep going.';
    }

    if (isCorrect) {
      setConceptCorrect((v) => v + 1);
      playSuccessTone();
    }

    const nextAnswers = [...conceptAnswers, { question: currentQ.question, answer: inputValue, correct: isCorrect, score }];
    setConceptAnswers(nextAnswers);
    setFeedback(feedbackText);
    setInputValue('');

    if (questionIndex + 1 >= QUESTIONS_PER_CONCEPT) {
      const totalScore = Math.round(nextAnswers.reduce((a, x) => a + (x.score || 0), 0) / QUESTIONS_PER_CONCEPT);
      const mastered = totalScore >= 80;
      setConceptSummary({ score: totalScore, mastered, concept: currentArc.concept.title });
      setSessionResults((prev) => [...prev, { arc: currentArc, score: totalScore, mastered, answers: nextAnswers }]);
      return;
    }

    setQuestionIndex((v) => v + 1);
  }

  async function nextConceptOrFinish() {
    const latest = conceptSummary;
    if (!latest) return;

    if (!latest.mastered) {
      const previousQuestions = conceptAnswers.map((a) => a.question);
      const retry = await loadQuestions(currentArc, previousQuestions);
      setQuestions(retry);
      setQuestionIndex(0);
      setConceptCorrect(0);
      setConceptAnswers([]);
      setConceptSummary(null);
      setFeedback('Let’s reteach this concept with fresh questions.');
      return;
    }

    if (conceptCursor + 1 < sessionPlan.length) {
      const nextArc = sessionPlan[conceptCursor + 1];
      const nextQs = await loadQuestions(nextArc);
      setConceptCursor((v) => v + 1);
      setQuestions(nextQs);
      setQuestionIndex(0);
      setConceptCorrect(0);
      setConceptAnswers([]);
      setConceptSummary(null);
      setFeedback('');
      return;
    }

    completeSession();
  }

  async function sendParentDigest(overrideStatus) {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: state.profile.parentEmail,
        status: overrideStatus || state.parentStatus,
        streak: state.streak,
        weeklyCompleted: state.weeklyCompleted,
      }),
    });
  }

  function completeSession() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const minutesCompleted = Math.max(1, Math.round((SESSION_MINUTES * 60 - secondsLeft) / 60));
    const avgScore = sessionResults.length ? Math.round(sessionResults.reduce((a, r) => a + r.score, 0) / sessionResults.length) : 0;

    setState((prev) => {
      const next = structuredClone(prev);
      const subj = next.subjects[sessionSubject];

      sessionResults.forEach((result) => {
        const c = result.arc.concept;
        const cp = subj.conceptMap[c.id] || { status: 'not_started', attempts: 0, bestScore: 0, timeSpent: 0, title: c.title, unit: result.arc.unitTitle };
        cp.attempts += 1;
        cp.lastScore = result.score;
        cp.bestScore = Math.max(cp.bestScore || 0, result.score);
        cp.lastPracticed = now.toISOString();
        cp.timeSpent = (cp.timeSpent || 0) + Math.round((minutesCompleted / CONCEPTS_PER_SESSION) * 60);
        cp.status = result.mastered ? 'mastered' : cp.attempts > 1 ? 'struggling' : 'in_progress';
        subj.conceptMap[c.id] = cp;

        if (result.mastered && !subj.conceptsCompleted.includes(c.id)) subj.conceptsCompleted.push(c.id);
      });

      const masteredConcepts = sessionResults.filter((r) => r.mastered);
      if (masteredConcepts.length) {
        const lastMastered = masteredConcepts[masteredConcepts.length - 1].arc;
        subj.currentUnitIndex = lastMastered.unitIndex;
        subj.currentConceptIndex = Math.min(lastMastered.conceptIndex + 1, SUBJECTS[sessionSubject].units[lastMastered.unitIndex].concepts.length - 1);
      }

      subj.timeSpent += minutesCompleted;
      subj.mastery = recomputeSubjectMastery(subj);
      next.totalMinutes += minutesCompleted;
      next.lastCompletionDate = date;
      next.sessionLogs.unshift({
        date,
        duration: minutesCompleted,
        subject: sessionSubject,
        conceptId: sessionResults.map((r) => r.arc.concept.id).join(','),
        conceptTitle: sessionResults.map((r) => r.arc.concept.title).join(' · '),
        score: avgScore,
        mastered: avgScore >= 80,
      });
      next.parentStatus = `${next.profile.name || 'Raleigh'} completed today ✅`;
      return next;
    });

    confetti({ particleCount: 140, spread: 85, origin: { y: 0.6 } });
    setSummary({ score: avgScore, concepts: sessionResults.length, questions: CONCEPTS_PER_SESSION * QUESTIONS_PER_CONCEPT, time: minutesCompleted });
    setSessionActive(false);
    sendParentDigest('Session completed ✅').catch(() => {});
  }

  if (!state.profile.onboardingComplete) {
    return (
      <main className="container fadeIn">
        <section className="card" style={{ maxWidth: 640, margin: '24px auto' }}>
          <h1>Hi! I&apos;m your learning buddy 👋</h1>
          <input placeholder="What&apos;s your name?" value={state.profile.name} onChange={(e) => setState((p) => ({ ...p, profile: { ...p.profile, name: e.target.value } }))} />
          <label>Choose avatar</label>
          <div className="quickReplies">{AVATARS.map((a) => <button key={a} onClick={() => setState((p) => ({ ...p, profile: { ...p.profile, avatar: a } }))}>{a}</button>)}</div>
          <label>Start subject</label>
          <select value={state.profile.startSubject} onChange={(e) => setState((p) => ({ ...p, profile: { ...p.profile, startSubject: e.target.value } }))}>
            {SUBJECT_KEYS.map((k) => <option key={k} value={k}>{SUBJECTS[k].name}</option>)}
          </select>
          <label>Parent daily digest email</label>
          <input placeholder="parent@email.com" value={state.profile.parentEmail} onChange={(e) => setState((p) => ({ ...p, profile: { ...p.profile, parentEmail: e.target.value } }))} />
          <button className="primary" onClick={() => setState((p) => ({ ...p, profile: { ...p.profile, onboardingComplete: true } }))}>Start my first guided session ✨</button>
        </section>
      </main>
    );
  }

  return (
    <main className={`container fadeIn theme-${state.profile.theme}`}>
      <header className="header">
        <div><h1>{state.profile.avatar} Alpha Learning</h1><p>Welcome, {state.profile.name || 'Raleigh'}!</p></div>
        <div className="level">{level.name} · {totalMastery}% mastery</div>
      </header>

      <nav className="tabs">{['dashboard', 'session', 'progress', 'parent'].map((t) => <button key={t} onClick={() => setTab(t)} className={tab === t ? 'active' : ''}>{t[0].toUpperCase() + t.slice(1)}</button>)}</nav>

      {tab === 'dashboard' && (
        <section className="card">
          <h2>{state.parentStatus}</h2>
          <p>30-minute session: 3 concepts × 5 questions = 15 total.</p>
          <div className="actions">
            <button className="primary" onClick={() => startSession(suggested)}>Start Recommended</button>
            <select value={sessionSubject} onChange={(e) => setSessionSubject(e.target.value)}>{SUBJECT_KEYS.map((k) => <option key={k} value={k}>{SUBJECTS[k].name}</option>)}</select>
            <button className="secondary" onClick={() => startSession(sessionSubject)}>Start Chosen</button>
          </div>
        </section>
      )}

      {tab === 'session' && (
        <section className="grid two">
          <article className="card">
            {!sessionActive && !summary && <button className="primary" onClick={() => startSession(suggested)}>Start Session</button>}
            {currentArc && (
              <>
                <h2>Mini-arc {conceptCursor + 1}/{CONCEPTS_PER_SESSION}</h2>
                <p><strong>{SUBJECTS[sessionSubject].emoji} {currentArc.unitTitle}</strong> · {currentArc.concept.title}</p>
              </>
            )}

            {sessionActive && currentQ && !conceptSummary && (
              <div className="questionCard">
                <h3>Question {questionIndex + 1}/{QUESTIONS_PER_CONCEPT}</h3>
                <p>{currentQ.question}</p>
                {currentQ.type === 'multiple_choice' && <div className="quickReplies">{(currentQ.options || []).map((c) => <button key={c} className={inputValue === c ? 'selected' : ''} onClick={() => setInputValue(c)}>{c}</button>)}</div>}
                {currentQ.type !== 'multiple_choice' && <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} rows={3} placeholder="Type answer" />}
                <button className="primary" disabled={!inputValue.trim()} onClick={gradeQuestion}>Submit</button>
                {feedback && <p style={{ marginTop: 10 }}>{feedback}</p>}
              </div>
            )}

            {conceptSummary && (
              <div className="summaryBox">
                <h3>{conceptSummary.concept}</h3>
                <p>Score: <strong>{conceptSummary.score}%</strong></p>
                <p>{conceptSummary.mastered ? '✅ Mastered. Moving forward.' : '🔁 Let’s reteach before advancing.'}</p>
                <button className="primary" onClick={nextConceptOrFinish}>{conceptSummary.mastered ? (conceptCursor + 1 < CONCEPTS_PER_SESSION ? 'Next Concept' : 'Finish Session') : 'Reteach This Concept'}</button>
              </div>
            )}

            {summary && (
              <div className="summaryBox">
                <h3>Session Complete ✅</h3>
                <p>Concepts: {summary.concepts}/{CONCEPTS_PER_SESSION}</p>
                <p>Questions: {summary.questions}</p>
                <p>Score: {summary.score}%</p>
                <p>Time: {summary.time} minutes</p>
              </div>
            )}
          </article>

          <article className="card">
            <h3>Progress</h3>
            <ul>
              {[0, 1, 2].map((i) => <li key={i}>{i < conceptCursor ? '✅' : i === conceptCursor ? '▶️' : '⏳'} Mini-arc {i + 1}</li>)}
            </ul>
            <div className="timerCorner">{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</div>
          </article>
        </section>
      )}

      {tab === 'progress' && (
        <section className="grid two">
          {SUBJECT_KEYS.map((k) => (
            <article className="card" key={k}><h3>{SUBJECTS[k].emoji} {SUBJECTS[k].name}</h3><p>{state.subjects[k].mastery}% mastery</p></article>
          ))}
        </section>
      )}

      {tab === 'parent' && (
        <section className="grid two">
          <article className="card span2">
            <h2>Parent Dashboard</h2>
            <p style={{ fontSize: 20 }}><strong>{state.parentStatus}</strong></p>
            <p>Weekly done: {state.weeklyCompleted}/5 · Streak: {state.streak}</p>
            <input placeholder="Parent email" value={state.profile.parentEmail} onChange={(e) => setState((p) => ({ ...p, profile: { ...p.profile, parentEmail: e.target.value } }))} />
            <div className="actions">
              <button className="secondary" onClick={() => sendParentDigest()}>Send Daily Digest</button>
              <button className="secondary" onClick={() => exportData(state)}>Export JSON</button>
            </div>
          </article>
        </section>
      )}
    </main>
  );
}
