'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadState, saveState, defaultState, updateStreak, completedToday,
  overallMastery, getLevelInfo, getRecommendedSubject, checkNewBadges,
  BADGE_CATALOG, todayStr, daysBetween, getMondayOf, isWeekend, logSessionToSupabase
} from '../lib/storage';
import { SUBJECTS } from '../lib/curriculum';

// ─── Constants ────────────────────────────────────────────────────
const SUBJECT_KEYS = ['math', 'ela', 'science', 'social'];
const AVATARS = ['🦊', '🐼', '🦉', '🐻', '🐙', '🐉', '🦁', '🐯'];
const SUBJECT_META = {
  math:    { name: 'Math',          emoji: '➗', class: 'math' },
  ela:     { name: 'ELA / Reading', emoji: '📚', class: 'ela' },
  science: { name: 'Science',       emoji: '🔬', class: 'science' },
  social:  { name: 'Social Studies',emoji: '🗺️', class: 'social' },
};

// Session segments
const SEGMENTS = [
  { id: 'warmup',  label: '🌅 Warm-Up Review',  chipClass: 'segment-chip--warmup',  questions: 3 },
  { id: 'learn',   label: '🎯 New Concept',      chipClass: 'segment-chip--learn',   questions: 5 },
  { id: 'mastery', label: '⚡ Mastery Check',    chipClass: 'segment-chip--mastery', questions: 5 },
];
const TOTAL_SESSION_QUESTIONS = SEGMENTS.reduce((s, seg) => s + seg.questions, 0); // 13

// ─── Confetti Helper ──────────────────────────────────────────────
async function fireConfetti(opts = {}) {
  if (typeof window === 'undefined') return;
  const confetti = (await import('canvas-confetti')).default;
  confetti({
    particleCount: opts.particleCount || 120,
    spread: opts.spread || 80,
    origin: opts.origin || { y: 0.6 },
    colors: opts.colors || ['#6C47FF', '#FFD23F', '#FF6B35', '#10D48E'],
    ...opts,
  });
}

function fireMasteryConfetti() {
  // Gold + violet burst for mastery
  fireConfetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ['#6C47FF', '#FFD23F', '#4D29D9'] });
  setTimeout(() => fireConfetti({ particleCount: 80, spread: 60, origin: { x: 0.1, y: 0.6 } }), 300);
  setTimeout(() => fireConfetti({ particleCount: 80, spread: 60, origin: { x: 0.9, y: 0.6 } }), 400);
}

// ─── Star Particles ───────────────────────────────────────────────
function StarBurst({ x, y, active }) {
  if (!active) return null;
  return (
    <div style={{ position: 'fixed', left: x, top: y, pointerEvents: 'none', zIndex: 999 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          fontSize: '16px',
          animation: `starBurst${i} 0.5s ease-out forwards`,
          transform: `rotate(${i * 60}deg)`,
        }}>⭐</div>
      ))}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────
export default function AlphaLearning() {
  const [state, setState] = useState(null);
  const [view, setView] = useState('loading'); // loading | onboarding | dashboard | session | progress | parent
  const [onboardStep, setOnboardStep] = useState(0);
  const [onboardName, setOnboardName] = useState('');
  const [onboardAvatar, setOnboardAvatar] = useState(AVATARS[0]);
  const [onboardSubject, setOnboardSubject] = useState('math');

  // Session state
  const [sessionSubject, setSessionSubject] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [sessionSegmentIdx, setSessionSegmentIdx] = useState(0);
  const [sessionQIdx, setSessionQIdx] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState([]); // per-question results
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [answerState, setAnswerState] = useState('idle'); // idle | correct | wrong | grading
  const [textAnswer, setTextAnswer] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [tutorMsg, setTutorMsg] = useState('');
  const [loadingTutor, setLoadingTutor] = useState(false);

  // Session timer
  const [sessionSecs, setSessionSecs] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const timerRef = useRef(null);

  // Celebration
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  const [newBadgePopup, setNewBadgePopup] = useState(null);

  // Parent PIN
  const [parentPinInput, setParentPinInput] = useState('');
  const [parentUnlocked, setParentUnlocked] = useState(false);

  // Generated questions pool
  const [generatedPool, setGeneratedPool] = useState({});

  // Load state on mount
  useEffect(() => {
    const s = loadState();
    setState(s);
    if (!s.onboarded) {
      setView('onboarding');
    } else {
      setView('dashboard');
    }
  }, []);

  // Timer when in session
  useEffect(() => {
    if (view === 'session') {
      const start = Date.now();
      setSessionStartTime(start);
      setSessionSecs(0);
      timerRef.current = setInterval(() => {
        setSessionSecs(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [view]);

  // ─── Onboarding ─────────────────────────────────────────────────
  function completeOnboarding() {
    const newState = {
      ...defaultState(),
      profile: { name: onboardName.trim() || 'Raleigh', avatar: onboardAvatar, createdAt: new Date().toISOString() },
      onboarded: true,
    };
    setState(newState);
    saveState(newState);
    setView('dashboard');
  }

  // ─── Session Setup ───────────────────────────────────────────────
  async function startSession(subjectKey) {
    const subject = SUBJECTS[subjectKey];
    if (!subject) return;

    // Get current concept index
    const conceptIdx = state.subjects[subjectKey]?.conceptIndex || 0;

    // Build full ordered list of concepts
    const allConcepts = subject.units.flatMap(u => u.concepts);
    const concept = allConcepts[conceptIdx % allConcepts.length];

    // Build session questions across 3 segments
    // Segment 0 (warmup): review concepts from previous concepts
    // Segment 1 (learn): questions for current concept
    // Segment 2 (mastery): harder questions from current concept

    const questions = await buildSessionQuestions(subjectKey, concept, allConcepts, conceptIdx);
    setSessionQuestions(questions);
    setSessionSubject(subjectKey);
    setSessionSegmentIdx(0);
    setSessionQIdx(0);
    setSessionAnswers([]);
    setSelectedChoice(null);
    setAnswerState('idle');
    setTextAnswer('');
    setFeedbackMsg('');
    setTutorMsg('');
    setShowExplanation(true); // show explanation first
    setView('session');

    // Pre-load tutor explanation
    loadTutorMessage('explain', concept.title, subjectKey);
  }

  async function buildSessionQuestions(subjectKey, concept, allConcepts, conceptIdx) {
    const questions = [];

    // Warmup: 3 questions from previously seen concepts (or concept itself if first)
    const warmupConcept = conceptIdx > 0
      ? allConcepts[Math.max(0, conceptIdx - 1)]
      : concept;
    const warmupPool = getQuestionPool(warmupConcept, 'warmup');
    questions.push(...pickN(warmupPool, SEGMENTS[0].questions, []));

    // Learn: 5 questions from current concept (static + AI generated)
    const learnPool = await getAIEnrichedPool(concept, subjectKey, 5, []);
    questions.push(...pickN(learnPool, SEGMENTS[1].questions, []));

    // Mastery: 5 fresh questions (AI generated, never seen before)
    const masteryPool = await getAIEnrichedPool(concept, subjectKey, 5, learnPool.map(q => q.prompt));
    questions.push(...pickN(masteryPool, SEGMENTS[2].questions, []));

    return questions.map((q, i) => ({ ...q, segmentIdx: getSegmentForIdx(i) }));
  }

  function getSegmentForIdx(i) {
    if (i < SEGMENTS[0].questions) return 0;
    if (i < SEGMENTS[0].questions + SEGMENTS[1].questions) return 1;
    return 2;
  }

  function getQuestionPool(concept) {
    // Return static questions with shuffled choices
    return (concept.questions || []).map(q => ({
      ...q,
      choices: shuffleArray([...q.choices]),
    }));
  }

  async function getAIEnrichedPool(concept, subjectKey, count, seenQuestions) {
    // Start with static
    const staticQs = getQuestionPool(concept);

    // Try to generate more via AI
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: concept.id,
          conceptTitle: concept.title,
          explanation: concept.explanation,
          subject: subjectKey,
          count: count + 2, // generate a few extra for variety
          seenQuestions,
        }),
      });
      const data = await res.json();
      if (data.questions?.length > 0) {
        return [...data.questions, ...staticQs]; // AI questions first (freshest)
      }
    } catch {
      // Fall back to static
    }
    return staticQs;
  }

  function pickN(pool, n, exclude) {
    const filtered = pool.filter(q => !exclude.includes(q.prompt));
    const shuffled = shuffleArray([...filtered]);
    // If not enough, allow duplication
    const result = [];
    let i = 0;
    while (result.length < n) {
      result.push(shuffled[i % shuffled.length]);
      i++;
      if (i > shuffled.length * 2) break; // safety
    }
    return result.slice(0, n);
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ─── Session Logic ───────────────────────────────────────────────
  const currentQuestion = sessionQuestions[sessionQIdx];
  const currentSegment = currentQuestion ? SEGMENTS[currentQuestion.segmentIdx] : null;
  const isMultipleChoice = !currentQuestion?.type || currentQuestion?.type === 'multiple-choice';
  const isNumericOrText = currentQuestion?.type === 'numeric' || currentQuestion?.type === 'free-text';
  const totalProgress = sessionQIdx;
  const sessionDurationMins = (state?.settings?.sessionDurationMins || 30);
  const sessionLimitSecs = sessionDurationMins * 60;
  const secsLeft = sessionLimitSecs - sessionSecs;
  const timerClass = secsLeft <= 60 ? 'timer-display urgent' : secsLeft <= 300 ? 'timer-display warning' : 'timer-display';

  function formatTime(secs) {
    const m = Math.floor(Math.abs(secs) / 60);
    const s = Math.abs(secs) % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  async function submitAnswer(answer) {
    if (answerState !== 'idle') return;

    const q = currentQuestion;
    let isCorrect = false;

    if (isNumericOrText || q?.type === 'free-text') {
      setAnswerState('grading');
      try {
        const res = await fetch('/api/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q.prompt,
            expectedAnswer: q.answer,
            studentAnswer: answer,
            subject: sessionSubject,
          }),
        });
        const data = await res.json();
        isCorrect = data.correct;
        setFeedbackMsg(data.feedback || '');
        if (data.gibberish) {
          setAnswerState('idle');
          return;
        }
      } catch {
        // Fallback: keyword match
        const norm = (s) => s?.toLowerCase().trim() || '';
        isCorrect = norm(answer).includes(norm(q.answer)) || norm(q.answer).includes(norm(answer));
      }
    } else {
      // Multiple choice
      isCorrect = answer === q.answer;
      if (!isCorrect) {
        // Load tutor reteach message
        loadTutorMessage('reteach', getCurrentConceptTitle(), sessionSubject, answer, q.answer);
      } else {
        setFeedbackMsg('');
      }
    }

    setSelectedChoice(answer);
    setAnswerState(isCorrect ? 'correct' : 'wrong');
    setSessionAnswers(prev => [...prev, { question: q, answer, correct: isCorrect, segmentIdx: q.segmentIdx }]);

    // Star burst on correct
    if (isCorrect) {
      setTimeout(() => fireConfetti({ particleCount: 40, spread: 50, origin: { y: 0.7 }, scalar: 0.6 }), 100);
    }

    // Auto-advance after delay
    setTimeout(() => {
      advanceQuestion(isCorrect);
    }, isCorrect ? 1400 : 2200);
  }

  function advanceQuestion(wasCorrect) {
    const nextIdx = sessionQIdx + 1;

    if (nextIdx >= sessionQuestions.length) {
      // Session complete
      finishSession();
      return;
    }

    // Check if entering new segment
    const nextQ = sessionQuestions[nextIdx];
    if (nextQ && nextQ.segmentIdx !== currentQuestion?.segmentIdx) {
      // Show segment transition briefly
    }

    setSessionQIdx(nextIdx);
    setSelectedChoice(null);
    setAnswerState('idle');
    setTextAnswer('');
    setFeedbackMsg('');
    setTutorMsg('');

    // Show explanation at start of 'learn' segment
    const nextSeg = nextQ?.segmentIdx;
    setShowExplanation(nextSeg === 1 && nextIdx === SEGMENTS[0].questions);
  }

  function getCurrentConceptTitle() {
    if (!sessionSubject) return '';
    const conceptIdx = state.subjects[sessionSubject]?.conceptIndex || 0;
    const allConcepts = SUBJECTS[sessionSubject].units.flatMap(u => u.concepts);
    return allConcepts[conceptIdx % allConcepts.length]?.title || '';
  }

  function getCurrentConcept() {
    if (!sessionSubject) return null;
    const conceptIdx = state.subjects[sessionSubject]?.conceptIndex || 0;
    const allConcepts = SUBJECTS[sessionSubject].units.flatMap(u => u.concepts);
    return allConcepts[conceptIdx % allConcepts.length];
  }

  async function loadTutorMessage(mode, conceptTitle, subject, wrongAnswer, correctAnswer) {
    setLoadingTutor(true);
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, conceptTitle, subject, wrongAnswer, correctAnswer }),
      });
      const data = await res.json();
      setTutorMsg(data.response || '');
    } catch {
      setTutorMsg('');
    } finally {
      setLoadingTutor(false);
    }
  }

  function finishSession() {
    clearInterval(timerRef.current);
    const durationSecs = Math.floor((Date.now() - sessionStartTime) / 1000);

    // Calculate score
    const totalQs = sessionAnswers.length + 1; // +1 for current
    const correct = sessionAnswers.filter(a => a.correct).length;
    const score = Math.round((correct / Math.max(totalQs, 1)) * 100);

    // Mastery check (segment 2 = mastery check)
    const masteryAnswers = sessionAnswers.filter(a => a.segmentIdx === 2);
    const masteryScore = masteryAnswers.length > 0
      ? Math.round((masteryAnswers.filter(a => a.correct).length / masteryAnswers.length) * 100)
      : score;
    const mastered = masteryScore >= 90;

    // Update state
    const conceptIdx = state.subjects[sessionSubject]?.conceptIndex || 0;
    const allConcepts = SUBJECTS[sessionSubject].units.flatMap(u => u.concepts);
    const concept = allConcepts[conceptIdx % allConcepts.length];

    const newState = { ...state };

    // Update streak
    newState.streak = updateStreak(state.streak);

    // Update concept progress
    const conceptProgress = { ...(newState.subjects[sessionSubject]?.conceptProgress || {}) };
    conceptProgress[concept.id] = mastered ? 'mastered' : 'in-progress';
    
    // Advance concept if mastered
    const newConceptIdx = mastered ? (conceptIdx + 1) : conceptIdx;
    
    // Update mastery %
    const totalConcepts = allConcepts.length;
    const masteredCount = Object.values(conceptProgress).filter(v => v === 'mastered').length;
    const newMastery = Math.round((masteredCount / totalConcepts) * 100);

    newState.subjects = {
      ...newState.subjects,
      [sessionSubject]: {
        ...newState.subjects[sessionSubject],
        mastery: newMastery,
        conceptIndex: newConceptIdx,
        conceptProgress,
      },
    };

    // Session log
    const sessionEntry = {
      date: todayStr(),
      subject: sessionSubject,
      conceptId: concept.id,
      conceptTitle: concept.title,
      score,
      mastered,
      durationSecs,
      questionsTotal: totalQs,
      questionsCorrect: correct,
    };
    newState.sessions = [sessionEntry, ...(state.sessions || [])].slice(0, 30);

    // Check badges
    const { newBadges, allBadges } = checkNewBadges(newState, sessionEntry);
    newState.badges = allBadges;

    setState(newState);
    saveState(newState);

    // Log to Supabase
    if (state.profile?.name) {
      logSessionToSupabase(state.profile.name.toLowerCase(), sessionEntry).catch(() => {});
    }

    // Celebration
    setCelebrationData({ score, mastered, concept, subject: sessionSubject, durationSecs, newBadges });
    setShowCelebration(true);

    if (mastered) {
      fireMasteryConfetti();
    } else {
      fireConfetti({ particleCount: 80 });
    }

    // Show badge popup if any
    if (newBadges.length > 0) {
      setTimeout(() => setNewBadgePopup(newBadges[0]), 1500);
    }

    // Notify parent
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'session-complete',
        data: {
          studentName: state.profile?.name,
          subject: SUBJECT_META[sessionSubject]?.name,
          score,
          streak: newState.streak.current,
        },
      }),
    }).catch(() => {});
  }

  function exitCelebration() {
    setShowCelebration(false);
    setCelebrationData(null);
    setNewBadgePopup(null);
    setView('dashboard');
  }

  // ─── Rendering Helpers ───────────────────────────────────────────
  function greetingText() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function subjectMasteryBar(key) {
    const mastery = state?.subjects[key]?.mastery || 0;
    const colors = {
      math: { bar: '#3B82F6', end: '#1D4ED8' },
      ela: { bar: '#EC4899', end: '#BE185D' },
      science: { bar: '#10B981', end: '#065F46' },
      social: { bar: '#F59E0B', end: '#92400E' },
    }[key];
    return { mastery, ...colors };
  }

  function getWeekDots() {
    const today = todayStr();
    const monday = getMondayOf(today);
    const days = ['M', 'T', 'W', 'T', 'F'];
    return days.map((label, i) => {
      const d = new Date(monday + 'T12:00:00');
      d.setDate(d.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const done = (state?.sessions || []).some(s => s.date === ds);
      const isToday = ds === today;
      const isFuture = daysBetween(today, ds) > 0;
      let cls = 'week-dot';
      if (done) cls += ' done';
      else if (isToday) cls += ' today';
      else if (!isFuture) cls += ' skipped';
      return { label, cls };
    });
  }

  function getRecentSessions() {
    return (state?.sessions || []).slice(0, 5);
  }

  // ─── Views ────────────────────────────────────────────────────────

  if (!state || view === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>Loading Alpha Learning…</p>
        </div>
      </div>
    );
  }

  // ─── Onboarding ──────────────────────────────────────────────────
  if (view === 'onboarding') {
    return (
      <div className="onboarding-screen">
        <div className="onboarding-content">
          {onboardStep === 0 && (
            <div className="animate-fade-in">
              <div style={{ fontSize: 64, marginBottom: 16 }}>🦊</div>
              <h1 className="text-display" style={{ marginBottom: 8 }}>Welcome!</h1>
              <p style={{ fontSize: 'var(--text-body-lg)', marginBottom: 32 }}>
                I'm Remy, your learning buddy. Let's make learning awesome. What's your name?
              </p>
              <input
                className="name-input"
                type="text"
                placeholder="Type your name…"
                value={onboardName}
                onChange={e => setOnboardName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onboardName.trim() && setOnboardStep(1)}
                autoFocus
                maxLength={30}
              />
              <button
                className="btn btn--primary btn--large btn--full"
                onClick={() => setOnboardStep(1)}
                disabled={!onboardName.trim()}
                style={{ marginTop: 8 }}
              >
                Nice to meet you! →
              </button>
            </div>
          )}

          {onboardStep === 1 && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: 'var(--text-h1)', marginBottom: 8 }}>Pick your avatar!</h2>
              <p style={{ marginBottom: 8 }}>You can change this any time.</p>
              <div className="avatar-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', maxWidth: 400, margin: '16px auto' }}>
                {AVATARS.map(av => (
                  <button
                    key={av}
                    className={`avatar-option${onboardAvatar === av ? ' active' : ''}`}
                    onClick={() => setOnboardAvatar(av)}
                  >
                    {av}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn--ghost" onClick={() => setOnboardStep(0)}>← Back</button>
                <button className="btn btn--primary btn--large" style={{ flex: 1 }} onClick={() => setOnboardStep(2)}>
                  That's me! →
                </button>
              </div>
            </div>
          )}

          {onboardStep === 2 && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: 'var(--text-h1)', marginBottom: 8 }}>
                Hi, {onboardName}! {onboardAvatar}
              </h2>
              <p style={{ fontSize: 'var(--text-body-lg)', marginBottom: 24 }}>
                Which subject do you want to start with?
              </p>
              <div className="grid grid-2" style={{ gap: 12, marginBottom: 24 }}>
                {SUBJECT_KEYS.map(k => {
                  const meta = SUBJECT_META[k];
                  return (
                    <button
                      key={k}
                      className={`subject-card subject-card--${meta.class}`}
                      style={{
                        minHeight: 100,
                        border: onboardSubject === k ? `3px solid var(--color-primary)` : '2px solid transparent',
                        boxShadow: onboardSubject === k ? '0 0 0 4px rgba(108,71,255,0.15)' : undefined,
                      }}
                      onClick={() => setOnboardSubject(k)}
                    >
                      <div className="subject-card__icon">{meta.emoji}</div>
                      <div className="subject-card__name">{meta.name}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn--ghost" onClick={() => setOnboardStep(1)}>← Back</button>
                <button
                  className="btn btn--primary btn--large"
                  style={{ flex: 1 }}
                  onClick={completeOnboarding}
                >
                  Start my adventure! 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Session Complete Celebration ────────────────────────────────
  if (showCelebration && celebrationData) {
    const { score, mastered, concept, subject, durationSecs, newBadges } = celebrationData;
    const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
    const subMeta = SUBJECT_META[subject];

    return (
      <div className="celebration-screen">
        <div style={{ textAlign: 'center', maxWidth: 540, padding: '0 32px' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            {mastered ? '🏆' : score >= 90 ? '⭐' : '✅'}
          </div>
          <h1 className="text-display" style={{ marginBottom: 8 }}>
            {mastered ? 'MASTERED IT!' : score >= 80 ? 'GREAT SESSION!' : 'KEEP GOING!'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: 'var(--text-body-lg)' }}>
            {concept.title} · {subMeta.name}
          </p>

          <div className="score-reveal" style={{ fontSize: '5rem' }}>
            {score}%
          </div>

          <div className="stars-row" style={{ justifyContent: 'center' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="star" style={{ opacity: i < stars ? 1 : 0.2 }}>
                ⭐
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--color-primary-xlight)', borderRadius: 'var(--radius-xl)', padding: '16px 24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="text-stat">{score}%</div>
                <div className="text-muted">Score</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="text-stat">🔥{state.streak?.current || 1}</div>
                <div className="text-muted">Streak</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="text-stat">{Math.floor(durationSecs/60)}m</div>
                <div className="text-muted">Time</div>
              </div>
            </div>
          </div>

          {newBadges.length > 0 && (
            <div style={{ background: 'var(--color-accent-light)', border: '2px solid var(--color-accent)', borderRadius: 'var(--radius-xl)', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 32 }}>{newBadges[0].emoji}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-body)' }}>
                  New Badge: {newBadges[0].name}!
                </div>
                <div className="text-muted">{newBadges[0].desc}</div>
              </div>
            </div>
          )}

          <button className="btn btn--primary btn--large btn--full" onClick={exitCelebration}>
            Back to Dashboard 🏠
          </button>
        </div>
      </div>
    );
  }

  // ─── Main App Shell ──────────────────────────────────────────────
  const level = getLevelInfo(overallMastery(state.subjects));
  const streak = state.streak?.current || 0;
  const doneToday = completedToday(state.streak);
  const profileName = state.profile?.name || 'Raleigh';
  const profileAvatar = state.profile?.avatar || '🦊';

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__brand">
          <span style={{ fontSize: 28 }}>🦊</span>
          <h1>Alpha Learning</h1>
        </div>
        <div className="app-header__right">
          <div className="streak-badge">
            <span className="flame">🔥</span>
            <span>{streak} day{streak !== 1 ? 's' : ''}</span>
          </div>
          <nav className="nav-tabs">
            {[
              { id: 'dashboard', label: '🏠 Home' },
              { id: 'progress',  label: '📊 Progress' },
              { id: 'parent',    label: '👨‍💼 Parent' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`nav-tab${view === tab.id ? ' active' : ''}`}
                onClick={() => {
                  if (tab.id === 'parent' && !parentUnlocked) {
                    const pin = prompt('Enter parent PIN (or leave blank if not set):');
                    const storedPin = state.settings?.parentPin;
                    if (!storedPin || pin === storedPin) {
                      setParentUnlocked(true);
                      setView(tab.id);
                    } else {
                      alert('Incorrect PIN');
                    }
                    return;
                  }
                  setView(tab.id);
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            <span style={{ fontSize: 24 }}>{profileAvatar}</span>
            <span style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-secondary)' }}>{profileName}</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        {view === 'dashboard' && <DashboardView />}
        {view === 'session' && <SessionView />}
        {view === 'progress' && <ProgressView />}
        {view === 'parent' && <ParentDashboardView />}
      </main>

      {/* Badge popup */}
      {newBadgePopup && (
        <div className="badge-earned-popup">
          <div style={{ fontSize: 40 }}>{newBadgePopup.emoji}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--color-text)' }}>
              Badge Unlocked!
            </div>
            <div style={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>{newBadgePopup.name}</div>
            <div className="text-muted">{newBadgePopup.desc}</div>
          </div>
          <button
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-muted)' }}
            onClick={() => setNewBadgePopup(null)}
          >✕</button>
        </div>
      )}
    </div>
  );

  // ─── Dashboard View ──────────────────────────────────────────────
  function DashboardView() {
    const recommended = getRecommendedSubject(state);
    const conceptIdx = state.subjects[recommended]?.conceptIndex || 0;
    const allConcepts = SUBJECTS[recommended].units.flatMap(u => u.concepts);
    const concept = allConcepts[conceptIdx % allConcepts.length];
    const weekDots = getWeekDots();
    const overall = overallMastery(state.subjects);
    const levelInfo = getLevelInfo(overall);
    const recentSessions = getRecentSessions();

    return (
      <div className="container">
        <div className="page-layout">
          {/* Sidebar */}
          <aside className="sidebar">
            {/* Today status */}
            <div>
              <div className="sidebar__section-title">Today</div>
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-lg)',
                background: doneToday ? 'var(--color-success-light)' : 'var(--color-surface)',
                border: `1.5px solid ${doneToday ? 'var(--color-success)' : 'var(--color-border)'}`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ fontSize: 28 }}>{doneToday ? '✅' : '⏳'}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-body)' }}>
                    {doneToday ? 'Session complete!' : 'Not started yet'}
                  </div>
                  <div className="text-muted">{doneToday ? 'Great work today!' : 'Your streak is waiting 🔥'}</div>
                </div>
              </div>
            </div>

            {/* Week dots */}
            <div>
              <div className="sidebar__section-title">This Week</div>
              <div className="week-dots">
                {weekDots.map((dot, i) => (
                  <div key={i} className={dot.cls} title={dot.label}>{dot.label}</div>
                ))}
              </div>
            </div>

            {/* Level ring */}
            <div>
              <div className="sidebar__section-title">Level</div>
              <div className="level-ring-container">
                <div className="level-ring">
                  <svg viewBox="0 0 80 80" width="80" height="80">
                    <circle className="level-ring__bg" cx="40" cy="40" r="32" />
                    <circle
                      className="level-ring__fill"
                      cx="40" cy="40" r="32"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - levelInfo.progress / 100)}`}
                    />
                  </svg>
                  <div className="level-ring__label">{levelInfo.progress}%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-body)' }}>
                    {levelInfo.emoji} {levelInfo.name}
                  </div>
                  {levelInfo.nextLevel && (
                    <div className="text-muted">{levelInfo.nextLevel.min - overall}% to {levelInfo.nextLevel.name}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent badges */}
            {state.badges.length > 0 && (
              <div>
                <div className="sidebar__section-title">Recent Badges</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {state.badges.slice(-3).map(id => {
                    const badge = BADGE_CATALOG.find(b => b.id === id);
                    if (!badge) return null;
                    return (
                      <div key={id} title={badge.desc} style={{
                        width: 40, height: 40, borderRadius: 'var(--radius-full)',
                        background: 'var(--color-accent-light)', border: '1.5px solid var(--color-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, cursor: 'help',
                      }}>
                        {badge.emoji}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Greeting */}
            <div>
              <h1>{greetingText()}, {profileName}! {profileAvatar}</h1>
              <p>Overall mastery: <strong style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{overall}%</strong> across all subjects</p>
            </div>

            {/* Recommended session card */}
            <div className="card card--hero" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div className="pill pill--primary" style={{ marginBottom: 12 }}>⭐ Recommended for you</div>
                  <h2 style={{ marginBottom: 4 }}>{concept?.title}</h2>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: 0 }}>
                    {SUBJECT_META[recommended].emoji} {SUBJECT_META[recommended].name} ·{' '}
                    {state.subjects[recommended]?.mastery || 0}% mastered
                  </p>
                </div>
                <button
                  className="btn btn--primary btn--large"
                  onClick={() => startSession(recommended)}
                  style={{ minWidth: 200 }}
                >
                  🚀 Start Session
                </button>
              </div>
            </div>

            {/* Subject cards */}
            <div>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>All Subjects</h3>
              <div className="grid grid-4 subject-grid-4" style={{ gap: 'var(--space-4)' }}>
                {SUBJECT_KEYS.map(k => {
                  const meta = SUBJECT_META[k];
                  const subj = state.subjects[k];
                  const mastery = subj?.mastery || 0;
                  const conceptIdx = subj?.conceptIndex || 0;
                  const allConcepts = SUBJECTS[k].units.flatMap(u => u.concepts);
                  const currConcept = allConcepts[conceptIdx % allConcepts.length];
                  const unit = SUBJECTS[k].units.find(u => u.concepts.some(c => c.id === currConcept?.id));

                  return (
                    <button
                      key={k}
                      className={`subject-card subject-card--${meta.class}`}
                      onClick={() => startSession(k)}
                      style={{ width: '100%', textAlign: 'left' }}
                    >
                      <div className="subject-card__icon">{meta.emoji}</div>
                      <div className="subject-card__name">{meta.name}</div>
                      <div className="subject-card__unit">{unit?.title || 'Unit 1'}</div>
                      <div className="subject-card__mastery">{mastery}%</div>
                      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: 'auto' }}>
                        {mastery >= 80 ? '🏆 Almost mastered!' : mastery >= 50 ? '💪 Keep going!' : '🌱 Just getting started'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent sessions */}
            {recentSessions.length > 0 && (
              <div>
                <h3 style={{ marginBottom: 'var(--space-3)' }}>Recent Sessions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentSessions.map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', background: 'var(--color-surface)',
                      border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-lg)',
                    }}>
                      <div style={{ fontSize: 24 }}>{SUBJECT_META[s.subject]?.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-body)' }}>
                          {s.conceptTitle}
                        </div>
                        <div className="text-muted">{s.date} · {SUBJECT_META[s.subject]?.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontWeight: 700,
                          color: s.score >= 90 ? 'var(--color-success-dark)' : s.score >= 70 ? 'var(--color-primary)' : 'var(--color-error-dark)',
                        }}>
                          {s.score}%
                        </div>
                        {s.mastered && <div className="pill pill--success">Mastered ✅</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Session View ────────────────────────────────────────────────
  function SessionView() {
    const concept = getCurrentConcept();
    const subMeta = SUBJECT_META[sessionSubject] || {};
    const segment = currentSegment;
    const q = currentQuestion;
    const globalQNum = sessionQIdx + 1;
    const segStart = segment ? SEGMENTS.slice(0, q?.segmentIdx).reduce((s, seg) => s + seg.questions, 0) : 0;
    const qInSeg = q ? sessionQIdx - segStart + 1 : 0;
    const qTotalInSeg = segment?.questions || 5;

    // Show explanation panel only during 'learn' segment intro
    const shouldShowExplanation = showExplanation && q?.segmentIdx === 1 && qInSeg === 1;

    return (
      <div className="session-layout">
        {/* Session sidebar */}
        <div className="session-sidebar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn--ghost"
              style={{ minHeight: 36, padding: '6px 12px', fontSize: 'var(--text-caption)' }}
              onClick={() => {
                if (confirm('End session? Progress so far will be saved.')) {
                  finishSession();
                }
              }}
            >
              ← Exit
            </button>
          </div>

          {/* Subject + concept info */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{subMeta.emoji}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-body)', marginBottom: 2 }}>
              {subMeta.name}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-caption)', fontWeight: 600 }}>
              {concept?.title}
            </div>
          </div>

          {/* Segment indicators */}
          <div>
            <div className="sidebar__section-title">Session</div>
            {SEGMENTS.map((seg, i) => {
              const segCompleted = q && q.segmentIdx > i;
              const segCurrent = q && q.segmentIdx === i;
              return (
                <div key={seg.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                  opacity: segCompleted || segCurrent ? 1 : 0.4,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: segCompleted ? 'var(--color-success)' : segCurrent ? 'var(--color-primary)' : 'var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: 'white', flexShrink: 0,
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                  }}>
                    {segCompleted ? '✓' : i + 1}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-caption)' }}>
                      {seg.label}
                    </div>
                    <div className="text-muted">{seg.questions} questions</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress */}
          <div>
            <div className="sidebar__section-title" style={{ marginBottom: 8 }}>
              Progress — {globalQNum}/{sessionQuestions.length}
            </div>
            <div className="progress-track" style={{ flexWrap: 'wrap', gap: 4 }}>
              {sessionQuestions.map((_, i) => {
                const ans = sessionAnswers[i];
                const isCurr = i === sessionQIdx;
                let cls = 'progress-dot';
                if (ans) cls += ans.correct ? ' completed' : ' completed'; // all answered = filled
                if (isCurr) cls += ' current';
                return <div key={i} className={cls} style={{ width: 14, height: 14 }} />;
              })}
            </div>
          </div>

          {/* Tutor message */}
          {tutorMsg && (
            <div style={{
              background: 'var(--color-primary-xlight)',
              border: '1.5px solid var(--color-primary-light)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-3)',
            }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>🦊 Remy says:</div>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text)', lineHeight: 1.5 }}>
                {tutorMsg}
              </p>
            </div>
          )}
          {loadingTutor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)', fontSize: 'var(--text-caption)' }}>
              <div className="spinner" style={{ width: 16, height: 16 }} />
              Remy is thinking…
            </div>
          )}
        </div>

        {/* Session main area */}
        <div className="session-main">
          {/* Header */}
          <div className="session-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {segment && (
                <span className={`segment-chip ${segment.chipClass}`}>
                  {segment.label}
                </span>
              )}
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-label)', fontFamily: 'var(--font-mono)' }}>
                Q{qInSeg}/{qTotalInSeg}
              </span>
            </div>
            <div className={timerClass}>
              ⏱ {formatTime(secsLeft)}
            </div>
          </div>

          {/* Explanation panel (at start of learn segment) */}
          {shouldShowExplanation && concept && (
            <div className="explanation-panel animate-slide-down">
              <h3>📖 Let's Learn</h3>
              <p>{concept.explanation}</p>
              <button
                className="btn btn--secondary"
                style={{ marginTop: 'var(--space-3)' }}
                onClick={() => setShowExplanation(false)}
              >
                Got it — let's practice! →
              </button>
            </div>
          )}

          {/* Question card */}
          {q && !shouldShowExplanation && (
            <div className="question-card">
              <div className="question-prompt">{q.prompt}</div>

              {/* Multiple choice */}
              {isMultipleChoice && (
                <div className={`answer-grid${q.choices?.length <= 2 ? ' answer-grid--single' : ''}`}>
                  {(q.choices || []).map((choice, ci) => {
                    let cls = 'answer-choice';
                    if (selectedChoice === choice) {
                      cls += answerState === 'correct' ? ' correct' :
                             answerState === 'wrong'   ? ' wrong'   : ' selected';
                    }
                    if (answerState !== 'idle' && answerState !== 'grading') cls += ' disabled';
                    return (
                      <button
                        key={ci}
                        className={cls}
                        disabled={answerState !== 'idle'}
                        onClick={() => submitAnswer(choice)}
                      >
                        <span className="answer-letter">{String.fromCharCode(65 + ci)}</span>
                        <span>{choice}</span>
                        {selectedChoice === choice && answerState === 'correct' && <span style={{ marginLeft: 'auto' }}>✅</span>}
                        {selectedChoice === choice && answerState === 'wrong'   && <span style={{ marginLeft: 'auto' }}>❌</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Free text input */}
              {q.type === 'free-text' && (
                <div style={{ marginTop: 'var(--space-5)' }}>
                  <textarea
                    className="text-input"
                    placeholder="Type your answer here…"
                    value={textAnswer}
                    onChange={e => setTextAnswer(e.target.value)}
                    disabled={answerState !== 'idle'}
                    rows={4}
                  />
                  <button
                    className="btn btn--primary btn--full"
                    style={{ marginTop: 'var(--space-3)' }}
                    disabled={answerState !== 'idle' || !textAnswer.trim()}
                    onClick={() => submitAnswer(textAnswer)}
                  >
                    {answerState === 'grading' ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Checking…</> : 'Submit Answer →'}
                  </button>
                </div>
              )}

              {/* Numeric input */}
              {q.type === 'numeric' && (
                <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    className="numeric-input"
                    type="text"
                    inputMode="decimal"
                    placeholder="?"
                    value={textAnswer}
                    onChange={e => setTextAnswer(e.target.value)}
                    disabled={answerState !== 'idle'}
                    onKeyDown={e => e.key === 'Enter' && textAnswer.trim() && submitAnswer(textAnswer)}
                  />
                  <button
                    className="btn btn--primary"
                    disabled={answerState !== 'idle' || !textAnswer.trim()}
                    onClick={() => submitAnswer(textAnswer)}
                  >
                    Check ✓
                  </button>
                </div>
              )}

              {/* Feedback */}
              {(answerState === 'correct' || answerState === 'wrong') && (
                <div className={`feedback-panel feedback-panel--${answerState === 'correct' ? 'correct' : 'wrong'}`}>
                  <p>
                    {answerState === 'correct'
                      ? feedbackMsg || '🎉 Correct! Great job!'
                      : feedbackMsg || `Not quite — the answer was: ${q.answer}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Between segments: segment complete message */}
          {!q && !showCelebration && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
                <h2>Loading next question…</h2>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Progress View ───────────────────────────────────────────────
  function ProgressView() {
    const overall = overallMastery(state.subjects);
    const levelInfo = getLevelInfo(overall);
    const earnedBadges = BADGE_CATALOG.filter(b => state.badges.includes(b.id));
    const lockedBadges = BADGE_CATALOG.filter(b => !state.badges.includes(b.id));

    return (
      <div className="container" style={{ paddingTop: 'var(--space-5)' }}>
        <h1 style={{ marginBottom: 'var(--space-5)' }}>Your Progress</h1>

        {/* Overall mastery */}
        <div className="card card--hero" style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="text-stat" style={{ fontSize: '3.5rem' }}>{overall}%</div>
            <div className="text-muted">Overall Mastery</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'var(--text-h2)', marginBottom: 4 }}>
              {levelInfo.emoji} {levelInfo.name}
            </div>
            {levelInfo.nextLevel ? (
              <>
                <div className="text-muted" style={{ marginBottom: 8 }}>
                  {levelInfo.nextLevel.min - overall}% to reach {levelInfo.nextLevel.name}
                </div>
                <div className="mastery-bar" style={{ height: 12, background: 'var(--color-border)' }}>
                  <div className="mastery-bar__fill" style={{
                    width: `${levelInfo.progress}%`,
                    '--bar-color': 'var(--color-primary)',
                    '--bar-color-end': 'var(--color-secondary)',
                  }} />
                </div>
              </>
            ) : (
              <div className="pill pill--success">🏆 Maximum level achieved!</div>
            )}
          </div>
        </div>

        {/* Subject mastery breakdown */}
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Subject Mastery</h2>
        <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
          {SUBJECT_KEYS.map(k => {
            const meta = SUBJECT_META[k];
            const mastery = state.subjects[k]?.mastery || 0;
            const cp = state.subjects[k]?.conceptProgress || {};
            const mastered = Object.values(cp).filter(v => v === 'mastered').length;
            const allConcepts = SUBJECTS[k].units.flatMap(u => u.concepts);
            const colors = {
              math: '#3B82F6', ela: '#EC4899', science: '#10B981', social: '#F59E0B',
            };

            return (
              <div key={k} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)',
                    background: colors[k], display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 20,
                  }}>
                    {meta.emoji}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>{meta.name}</div>
                    <div className="text-muted">{mastered}/{allConcepts.length} concepts mastered</div>
                  </div>
                  <div style={{
                    marginLeft: 'auto', fontFamily: 'var(--font-mono)',
                    fontWeight: 700, fontSize: 'var(--text-h2)', color: colors[k],
                  }}>
                    {mastery}%
                  </div>
                </div>
                <div className="mastery-bar" style={{ height: 10 }}>
                  <div className="mastery-bar__fill" style={{
                    width: `${mastery}%`,
                    '--bar-color': colors[k],
                    '--bar-color-end': colors[k],
                  }} />
                </div>

                {/* Concept list */}
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {allConcepts.slice(0, 10).map(c => {
                    const status = cp[c.id];
                    return (
                      <div key={c.id} title={c.title} style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: status === 'mastered' ? colors[k] :
                                    status === 'in-progress' ? `${colors[k]}44` : 'var(--color-border)',
                        border: `2px solid ${status ? colors[k] : 'var(--color-border)'}`,
                      }} />
                    );
                  })}
                  {allConcepts.length > 10 && (
                    <div className="text-muted" style={{ lineHeight: '20px', fontSize: 10 }}>
                      +{allConcepts.length - 10}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Badges */}
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Badges ({earnedBadges.length}/{BADGE_CATALOG.length})</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          {earnedBadges.map(badge => (
            <div key={badge.id} className="badge-card earned animate-bounce-in">
              <div className="badge-icon">{badge.emoji}</div>
              <div className="badge-name">{badge.name}</div>
              <div className="text-muted" style={{ fontSize: 10 }}>{badge.desc}</div>
            </div>
          ))}
          {lockedBadges.map(badge => (
            <div key={badge.id} className="badge-card locked" title={badge.desc}>
              <div className="badge-icon">🔒</div>
              <div className="badge-name">{badge.name}</div>
            </div>
          ))}
        </div>

        {/* Streak history */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>🔥 Streak Stats</h3>
          <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="text-stat">{state.streak?.current || 0}</div>
              <div className="text-muted">Current Streak</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="text-stat">{state.streak?.longest || 0}</div>
              <div className="text-muted">Longest Streak</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="text-stat">{(state.sessions || []).length}</div>
              <div className="text-muted">Total Sessions</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Parent Dashboard View ────────────────────────────────────────
  function ParentDashboardView() {
    const overall = overallMastery(state.subjects);
    const sessions = state.sessions || [];
    const doneT = completedToday(state.streak);
    const todaySession = sessions.find(s => s.date === todayStr());
    const weekSessions = sessions.filter(s => daysBetween(s.date, todayStr()) <= 7);
    const weekCount = new Set(weekSessions.map(s => s.date)).size;
    const colors = { math: '#3B82F6', ela: '#EC4899', science: '#10B981', social: '#F59E0B' };
    const weekDots = getWeekDots();

    function exportData() {
      const data = {
        student: state.profile,
        exportDate: new Date().toISOString(),
        overall,
        streak: state.streak,
        badges: state.badges,
        subjects: SUBJECT_KEYS.reduce((acc, k) => {
          acc[k] = {
            mastery: state.subjects[k]?.mastery,
            conceptProgress: state.subjects[k]?.conceptProgress,
          };
          return acc;
        }, {}),
        recentSessions: sessions.slice(0, 20),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alpha-learning-${state.profile?.name || 'raleigh'}-${todayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    async function setParentPin() {
      const newPin = prompt('Set a 4-digit parent PIN (leave blank to remove):');
      if (newPin === null) return;
      const newState = { ...state, settings: { ...state.settings, parentPin: newPin || null } };
      setState(newState);
      saveState(newState);
      alert(newPin ? 'PIN set!' : 'PIN removed.');
    }

    return (
      <div className="parent-dashboard">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
          <div>
            <h1>Parent Dashboard</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {profileName}'s learning progress — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn--ghost" onClick={setParentPin}>🔐 Set PIN</button>
            <button className="btn btn--secondary" onClick={exportData}>📥 Export Data</button>
          </div>
        </div>

        {/* Today's status — the most important thing */}
        <div style={{
          padding: '20px 24px',
          borderRadius: 'var(--radius-xl)',
          background: doneT ? 'var(--color-success-light)' : 'var(--color-warning-light)',
          border: `2px solid ${doneT ? 'var(--color-success)' : 'var(--color-warning)'}`,
          display: 'flex', alignItems: 'center', gap: 16,
          marginBottom: 'var(--space-5)',
        }}>
          <div style={{ fontSize: 48 }}>{doneT ? '✅' : '⏳'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'var(--text-h2)', color: 'var(--color-text)' }}>
              {doneT ? `${profileName} completed today's session!` : `${profileName} hasn't started today yet`}
            </div>
            {todaySession && (
              <div style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {SUBJECT_META[todaySession.subject]?.name} · {todaySession.score}% · {Math.floor(todaySession.durationSecs/60)} min
                {todaySession.mastered && ' · Concept Mastered! 🏆'}
              </div>
            )}
            {!doneT && (
              <div style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Streak: 🔥{state.streak?.current || 0} days — check in with {profileName}!
              </div>
            )}
          </div>
        </div>

        {/* Key stats */}
        <div className="parent-stat-grid" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="parent-stat-card">
            <h3>Overall Mastery</h3>
            <div className="text-stat">{overall}%</div>
            <div className="text-muted">{getLevelInfo(overall).emoji} {getLevelInfo(overall).name}</div>
          </div>
          <div className="parent-stat-card">
            <h3>Current Streak</h3>
            <div className="text-stat">🔥 {state.streak?.current || 0}</div>
            <div className="text-muted">Longest: {state.streak?.longest || 0} days</div>
          </div>
          <div className="parent-stat-card">
            <h3>This Week</h3>
            <div className="text-stat">{weekCount}/5</div>
            <div className="text-muted">Sessions completed</div>
            <div className="week-dots" style={{ marginTop: 8, justifyContent: 'center' }}>
              {weekDots.map((dot, i) => <div key={i} className={dot.cls} style={{ width: 28, height: 28, fontSize: 10 }}>{dot.label}</div>)}
            </div>
          </div>
        </div>

        {/* Subject breakdown */}
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Subject Progress</h2>
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="mastery-bar-container">
            {SUBJECT_KEYS.map(k => {
              const meta = SUBJECT_META[k];
              const mastery = state.subjects[k]?.mastery || 0;
              const allConcepts = SUBJECTS[k].units.flatMap(u => u.concepts);
              const cp = state.subjects[k]?.conceptProgress || {};
              const mastered = Object.values(cp).filter(v => v === 'mastered').length;
              return (
                <div key={k}>
                  <div className="mastery-bar-row">
                    <div className="mastery-bar-label">{meta.emoji} {meta.name}</div>
                    <div className="mastery-bar">
                      <div className="mastery-bar__fill" style={{
                        width: `${mastery}%`,
                        '--bar-color': colors[k],
                        '--bar-color-end': colors[k],
                      }} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: colors[k] }}>{mastery}%</div>
                  </div>
                  <div className="text-muted" style={{ marginBottom: 12, marginLeft: 108, fontSize: 11 }}>
                    {mastered}/{allConcepts.length} concepts mastered
                    {mastered > 0 && ` · Next: ${allConcepts[state.subjects[k]?.conceptIndex || 0]?.title || 'Complete!'}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session log */}
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Session History</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 'var(--space-6)' }}>
          {sessions.slice(0, 10).map((s, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '100px 1fr 80px 80px 80px',
              alignItems: 'center', gap: 16,
              padding: '12px 16px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-body)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
                {s.date}
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{s.conceptTitle}</span>
                <span style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}>{SUBJECT_META[s.subject]?.name}</span>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'center',
                color: s.score >= 90 ? 'var(--color-success-dark)' : s.score >= 70 ? 'var(--color-primary)' : 'var(--color-secondary)',
              }}>
                {s.score}%
              </div>
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)' }}>
                {Math.floor(s.durationSecs/60)}m
              </div>
              <div style={{ textAlign: 'center' }}>
                {s.mastered ? <span className="pill pill--success">✅ Mastered</span> : <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-caption)' }}>In progress</span>}
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
              No sessions yet — {profileName} hasn't started!
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>⚙️ Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Session Duration</div>
                <div className="text-muted">Default: 30 minutes</div>
              </div>
              <select
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--color-border)', fontFamily: 'var(--font-display)',
                  fontWeight: 700, cursor: 'pointer',
                }}
                value={state.settings?.sessionDurationMins || 30}
                onChange={e => {
                  const newState = { ...state, settings: { ...state.settings, sessionDurationMins: Number(e.target.value) } };
                  setState(newState);
                  saveState(newState);
                }}
              >
                {[15, 20, 25, 30, 45, 60].map(m => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </select>
            </div>

            <div className="divider" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Reset Progress</div>
                <div className="text-muted">Warning: this cannot be undone</div>
              </div>
              <button
                className="btn btn--ghost"
                style={{ color: 'var(--color-error-dark)', borderColor: 'var(--color-error)' }}
                onClick={() => {
                  if (confirm(`Reset ALL of ${profileName}'s progress? This cannot be undone.`)) {
                    const fresh = { ...defaultState(), profile: state.profile, onboarded: true };
                    setState(fresh);
                    saveState(fresh);
                    setView('dashboard');
                  }
                }}
              >
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
