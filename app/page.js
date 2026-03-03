'use client';

import { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { SUBJECTS } from '@/lib/curriculum';
import {
  computeBadges,
  computeStreakState,
  exportData,
  getLevel,
  initialState,
  loadState,
  recomputeSubjectMastery,
  saveState,
  syncStateToSupabase,
  weeklyCompletionCount,
} from '@/lib/storage';

const SUBJECT_KEYS = Object.keys(SUBJECTS);
const SESSION_MINUTES = 30;
const SEGMENTS = [
  { id: 'review', title: 'Segment 1 · Review', minutes: 10 },
  { id: 'new', title: 'Segment 2 · New Learning', minutes: 10 },
  { id: 'challenge', title: 'Segment 3 · Challenge/Fun', minutes: 10 },
];
const AVATARS = ['🦊', '🐼', '🐯', '🦄'];

function getConcept(subjectKey, unitIndex, conceptIndex) {
  const subject = SUBJECTS[subjectKey];
  const unit = subject?.units?.[unitIndex] || subject?.units?.[0];
  return { subject, unit, concept: unit?.concepts?.[conceptIndex] || unit?.concepts?.[0] };
}

function parseNumber(v) {
  const n = Number(String(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

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

export default function HomePage() {
  const [state, setState] = useState(initialState);
  const [tab, setTab] = useState('dashboard');
  const [sessionSubject, setSessionSubject] = useState('math');
  const [sessionActive, setSessionActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_MINUTES * 60);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [summary, setSummary] = useState(null);
  const [pulse, setPulse] = useState(false);
  const [dailyChallengeDone, setDailyChallengeDone] = useState(false);

  const suggested = recommendation(state);
  const { subject, unit, concept } = getConcept(
    sessionSubject,
    state.subjects[sessionSubject]?.currentUnitIndex || 0,
    state.subjects[sessionSubject]?.currentConceptIndex || 0,
  );

  useEffect(() => setState(loadState()), []);
  useEffect(() => {
    saveState(state);
    syncStateToSupabase(state);
  }, [state]);

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
    const seg = Math.min(2, Math.floor(((SESSION_MINUTES * 60 - secondsLeft) / 600)));
    if (seg !== segmentIndex && sessionActive) {
      setSegmentIndex(seg);
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    }
  }, [secondsLeft, sessionActive]);

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

  const reviewQuestions = useMemo(() => {
    const mastered = Object.values(state.subjects[sessionSubject]?.conceptMap || {}).filter((c) => c.status === 'mastered').slice(0, 3);
    return mastered.map((m) => ({ type: 'free_text', prompt: `Quick review: explain ${m.title} in one sentence.`, sample_answer: m.title }));
  }, [state.subjects, sessionSubject]);

  const baseQuestions = useMemo(() => (concept?.questions || []).map((x) => ({ ...x, type: x.type || 'multiple_choice' })), [concept?.id]);
  const challengeQuestion = useMemo(() => ({
    type: 'free_text',
    prompt: `Bonus round: connect ${concept?.title} to real life in one sentence.`,
    sample_answer: concept?.explanation?.slice(0, 60) || 'Real-life connection',
  }), [concept?.id]);

  const segmentedQuestions = [...reviewQuestions, ...baseQuestions, challengeQuestion];
  const currentQ = segmentedQuestions[questionIndex];

  function startSession(subjectKey = suggested) {
    setSessionSubject(subjectKey);
    setTab('session');
    setSessionActive(true);
    setSecondsLeft(SESSION_MINUTES * 60);
    setSegmentIndex(0);
    setQuestionIndex(0);
    setCorrect(0);
    setAnswers([]);
    setSummary(null);
  }

  async function gradeCurrentQuestion() {
    if (!currentQ) return;
    let isCorrect = false;

    if (currentQ.type === 'multiple_choice') {
      isCorrect = inputValue === currentQ.answer;
    } else if (currentQ.type === 'numeric_input') {
      const a = parseNumber(inputValue);
      const b = parseNumber(currentQ.answer);
      isCorrect = a !== null && b !== null && Math.abs(a - b) <= 0.01;
    } else {
      isCorrect = inputValue.trim().length > 8;
    }

    const nextAnswers = [...answers, { prompt: currentQ.prompt, correct: isCorrect, answer: inputValue }];
    setAnswers(nextAnswers);
    if (isCorrect) {
      setCorrect((v) => v + 1);
      setPulse(true);
      playSuccessTone();
      setTimeout(() => setPulse(false), 500);
    }

    setInputValue('');
    if (questionIndex + 1 >= segmentedQuestions.length) {
      completeSession(false, nextAnswers, isCorrect ? correct + 1 : correct);
    } else {
      setQuestionIndex((i) => i + 1);
    }
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
      next.parentStatus = `${next.profile.name || 'Raleigh'} completed today ✅`;
      return next;
    });

    if (isMastered) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }

    setSummary({ score, mastered: isMastered, time: minutesCompleted, concept: concept.title });
    setSessionActive(false);
  }

  async function sendParentDigest() {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: state.profile.parentEmail,
        status: state.parentStatus,
        streak: state.streak,
        weeklyCompleted: state.weeklyCompleted,
      }),
    });
  }

  function completeDailyChallenge() {
    if (dailyChallengeDone) return;
    setDailyChallengeDone(true);
    playSuccessTone();
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
  }

  if (!state.profile.onboardingComplete) {
    return (
      <main className="container fadeIn">
        <section className="card" style={{ maxWidth: 640, margin: '24px auto' }}>
          <h1>Hi! I&apos;m your learning buddy 👋</h1>
          <p>Let&apos;s set up your first adventure.</p>
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
        <section className="grid two">
          {state.sessionLogs.length === 0 ? (
            <article className="card hero span2">
              <h2>Welcome to your learning journey map 🗺️</h2>
              <p>Every session moves you to the next checkpoint. You&apos;re not at zero — you&apos;re at the start line.</p>
              <button className="primary" onClick={() => startSession(state.profile.startSubject)}>Start Guided First Session</button>
            </article>
          ) : (
            <article className="card hero span2">
              <h2>{state.parentStatus}</h2>
              <p>Freeze days used this week: <strong>{state.freezeDaysUsedThisWeek}/2</strong> · Weekends are protected.</p>
              <div className="actions">
                <button className="primary" onClick={() => startSession(suggested)}>Start Recommended</button>
                <select value={sessionSubject} onChange={(e) => setSessionSubject(e.target.value)}>{SUBJECT_KEYS.map((k) => <option key={k} value={k}>{SUBJECTS[k].name}</option>)}</select>
                <button className="secondary" onClick={() => startSession(sessionSubject)}>Start Chosen</button>
              </div>
            </article>
          )}

          <article className="card">
            <h3>Daily Challenge ⚡</h3>
            <p>Bonus question: Which subject do you want to crush today?</p>
            <button className="secondary" onClick={completeDailyChallenge}>{dailyChallengeDone ? 'Completed ✅' : 'Complete Challenge'}</button>
          </article>

          <article className="card">
            <h3>Journey Map</h3>
            <div style={{ display: 'flex', gap: 8 }}>{[0, 20, 40, 60, 80, 100].map((m) => <div key={m} style={{ flex: 1, padding: 6, borderRadius: 8, background: totalMastery >= m ? '#f59e0b' : '#fde68a' }}>{m}%</div>)}</div>
          </article>
        </section>
      )}

      {tab === 'session' && (
        <section className="grid two ipad-session">
          <article className={`card ${pulse ? 'pulse' : ''}`}>
            <h2>{SEGMENTS[segmentIndex].title}</h2>
            <p><strong>{SUBJECTS[sessionSubject].emoji} {subject?.name}</strong> · {concept?.title}</p>
            {currentQ ? (
              <div className="questionCard">
                <h3>Question {questionIndex + 1}/{segmentedQuestions.length}</h3>
                <p>{currentQ.prompt}</p>
                {currentQ.type === 'multiple_choice' && <div className="quickReplies">{currentQ.choices.map((c) => <button key={c} className={inputValue === c ? 'selected' : ''} onClick={() => setInputValue(c)}>{c}</button>)}</div>}
                {(currentQ.type === 'numeric_input' || currentQ.type === 'free_text') && <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} rows={3} placeholder="Type answer" />}
                <button className="primary" disabled={!inputValue.trim()} onClick={gradeCurrentQuestion}>Submit</button>
              </div>
            ) : summary ? (
              <div className="summaryBox">
                <h3>Session Summary</h3>
                <p><strong>Concept:</strong> {summary.concept}</p>
                <p><strong>Score:</strong> {summary.score}% {summary.mastered ? '✅ Mastered' : '🔁 In Progress'}</p>
                <p><strong>Time:</strong> {summary.time} minutes</p>
              </div>
            ) : (
              <button className="primary" onClick={() => startSession(suggested)}>Start Session</button>
            )}
          </article>

          <article className="card chat">
            <h3>Mini-arc Progress</h3>
            <ul>
              {SEGMENTS.map((s, idx) => <li key={s.id}>{idx < segmentIndex ? '✅' : idx === segmentIndex ? '▶️' : '⏳'} {s.title}</li>)}
            </ul>
            <div className="bubble assistant">First session gets extra encouragement. You&apos;re doing great — keep going!</div>
          </article>

          <div className="timerCorner">{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</div>
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
            <p>Weekly done: {state.weeklyCompleted}/5 · Streak: {state.streak} · Freeze used: {state.freezeDaysUsedThisWeek}/2</p>
            <input placeholder="Parent email" value={state.profile.parentEmail} onChange={(e) => setState((p) => ({ ...p, profile: { ...p.profile, parentEmail: e.target.value } }))} />
            <div className="actions">
              <button className="secondary" onClick={sendParentDigest}>Send Daily Digest</button>
              <button className="secondary" onClick={() => exportData(state)}>Export JSON</button>
            </div>
          </article>
        </section>
      )}
    </main>
  );
}
