'use client';

import { useEffect, useMemo, useState } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { SUBJECTS } from '@/lib/curriculum';
import {
  computeBadges,
  exportData,
  getLevel,
  initialState,
  loadState,
  saveState,
  updateStreak,
  weeklyCompletionCount,
} from '@/lib/storage';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const SUBJECT_KEYS = Object.keys(SUBJECTS);
const SESSION_MINUTES = 30;

export default function HomePage() {
  const [state, setState] = useState(initialState);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionSubject, setSessionSubject] = useState('math');
  const [secondsLeft, setSecondsLeft] = useState(SESSION_MINUTES * 60);
  const [chat, setChat] = useState([]);
  const [pending, setPending] = useState(false);
  const [conceptProgress, setConceptProgress] = useState({ asked: 0, correct: 0, conceptTitle: 'Ready to begin' });

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!sessionActive) return;
    const interval = setInterval(() => {
      setSecondsLeft((sec) => {
        if (sec <= 1) {
          endSession(true);
          return 0;
        }
        return sec - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive]);

  const totalMastery = useMemo(() => {
    const vals = SUBJECT_KEYS.map((s) => state.subjects[s]?.mastery || 0);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [state.subjects]);

  const level = getLevel(totalMastery);

  useEffect(() => {
    const weeklyCompleted = weeklyCompletionCount(state.sessionLogs);
    const streak = updateStreak(state.lastCompletionDate, state.sessionLogs);
    const badges = computeBadges({ ...state, weeklyCompleted, streak });

    if (
      weeklyCompleted !== state.weeklyCompleted ||
      streak !== state.streak ||
      JSON.stringify(badges) !== JSON.stringify(state.badges)
    ) {
      setState((prev) => ({ ...prev, weeklyCompleted, streak, badges }));
    }
  }, [state.sessionLogs]);

  async function startSession() {
    setActiveTab('session');
    setSessionActive(true);
    setSecondsLeft(SESSION_MINUTES * 60);
    setChat([{ role: 'assistant', text: "Let's do this, Raleigh! Pick a subject and I'll guide us step by step." }]);
    setConceptProgress({ asked: 0, correct: 0, conceptTitle: 'Warming up...' });
  }

  async function sendTutorMessage(message = '') {
    setPending(true);
    const subjectData = SUBJECTS[sessionSubject];
    const subjectState = state.subjects[sessionSubject];

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: sessionSubject,
          unitIndex: subjectState.currentUnitIndex,
          conceptIndex: subjectState.currentConceptIndex,
          chat,
          message,
        }),
      });

      const data = await res.json();
      setChat((prev) => [...prev, ...(message ? [{ role: 'user', text: message }] : []), { role: 'assistant', text: data.reply }]);

      if (data.score) {
        const asked = data.score.total;
        const correct = data.score.correct;
        const pct = Math.round((correct / asked) * 100);

        setConceptProgress({
          asked,
          correct,
          conceptTitle: data.conceptTitle,
        });

        setState((prev) => {
          const next = structuredClone(prev);
          const subj = next.subjects[sessionSubject];
          subj.mastery = Math.min(100, Math.round((subj.mastery * 0.7) + (pct * 0.3)));
          if (pct >= 90) {
            const conceptId = data.conceptId;
            if (conceptId && !subj.conceptsCompleted.includes(conceptId)) subj.conceptsCompleted.push(conceptId);
            const currUnit = subjectData.units[subj.currentUnitIndex];
            const nextConceptIndex = subj.currentConceptIndex + 1;
            if (currUnit?.concepts?.[nextConceptIndex]) {
              subj.currentConceptIndex = nextConceptIndex;
            } else if (subjectData.units[subj.currentUnitIndex + 1]) {
              subj.currentUnitIndex += 1;
              subj.currentConceptIndex = 0;
            }
          }
          return next;
        });
      }
    } catch (error) {
      setChat((prev) => [...prev, { role: 'assistant', text: 'I hit a tiny hiccup. Try again and we will keep going.' }]);
    } finally {
      setPending(false);
    }
  }

  function endSession(auto = false) {
    const minutesCompleted = Math.max(1, Math.round((SESSION_MINUTES * 60 - secondsLeft) / 60));
    const date = new Date().toISOString().slice(0, 10);
    setState((prev) => {
      const next = structuredClone(prev);
      next.totalMinutes += minutesCompleted;
      next.lastCompletionDate = date;
      next.sessionLogs.unshift({
        date,
        duration: minutesCompleted,
        subject: sessionSubject,
        conceptsCovered: conceptProgress.asked,
        masteryScore: conceptProgress.asked ? Math.round((conceptProgress.correct / conceptProgress.asked) * 100) : 0,
      });
      next.subjects[sessionSubject].timeSpent += minutesCompleted;
      return next;
    });
    setSessionActive(false);
    setChat((prev) => [...prev, { role: 'assistant', text: auto ? "Great job staying focused for your full 30 minutes!" : 'Session saved. Nice work today!'}]);
  }

  const weeklyBarData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        label: 'Completed',
        data: Array.from({ length: 5 }, (_, idx) => (idx < state.weeklyCompleted ? 1 : 0)),
        backgroundColor: '#F59E0B',
        borderRadius: 10,
      },
    ],
  };

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1>Alpha Learning</h1>
          <p>Raleigh&apos;s Daily 30</p>
        </div>
        <div className="level">{level.name} · {totalMastery}% mastery</div>
      </header>

      <nav className="tabs">
        {['dashboard', 'session', 'progress', 'parent'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'active' : ''}>
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {activeTab === 'dashboard' && (
        <section className="grid two">
          <article className="card hero">
            <h2>Today&apos;s Session</h2>
            <p>30 minutes. One focused sprint. Big progress.</p>
            <button className="primary" onClick={startSession}>Start Learning</button>
            <div className="stats">
              <span>🔥 {state.streak} day streak</span>
              <span>{state.weeklyCompleted}/5 this week</span>
              <span>{state.totalMinutes} total mins</span>
            </div>
          </article>

          <article className="card">
            <h3>Weekly Progress (M-F)</h3>
            <Bar data={weeklyBarData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { display: false, max: 1 } } }} />
          </article>

          <article className="card span2">
            <h3>Subject Mastery</h3>
            <div className="rings">
              {SUBJECT_KEYS.map((key) => (
                <div key={key} className="ringWrap">
                  <Doughnut
                    data={{
                      labels: ['Mastery', 'Remaining'],
                      datasets: [{ data: [state.subjects[key]?.mastery || 0, 100 - (state.subjects[key]?.mastery || 0)], backgroundColor: ['#f59e0b', '#fde68a'], borderWidth: 0 }],
                    }}
                    options={{ plugins: { legend: { display: false } }, cutout: '72%' }}
                  />
                  <div className="ringLabel">
                    <strong>{state.subjects[key]?.mastery || 0}%</strong>
                    <small>{SUBJECTS[key].name}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === 'session' && (
        <section className="grid two">
          <article className="card">
            <h2>Learning Session</h2>
            <div className="timer">{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</div>
            <div className="progressMeter">
              <div style={{ width: `${conceptProgress.asked ? Math.round((conceptProgress.correct / conceptProgress.asked) * 100) : 0}%` }} />
            </div>
            <small>{conceptProgress.conceptTitle} · {conceptProgress.correct}/{conceptProgress.asked || 0} correct</small>
            <label>Subject</label>
            <select value={sessionSubject} onChange={(e) => setSessionSubject(e.target.value)}>
              {SUBJECT_KEYS.map((k) => <option key={k} value={k}>{SUBJECTS[k].name}</option>)}
            </select>
            <div className="actions">
              <button className="secondary" onClick={() => sendTutorMessage('Teach me this concept and then quiz me.')}>Get Guided Lesson</button>
              <button className="primary" onClick={() => endSession(false)}>Done for today</button>
            </div>
          </article>

          <article className="card chat">
            <h3>AI Tutor</h3>
            <div className="chatLog">
              {chat.map((entry, i) => (
                <div key={i} className={`bubble ${entry.role}`}>
                  {entry.text}
                </div>
              ))}
            </div>
            <QuickReplies onAsk={sendTutorMessage} pending={pending} />
          </article>
        </section>
      )}

      {activeTab === 'progress' && (
        <section className="grid two">
          <article className="card span2">
            <h2>Completion Heatmap</h2>
            <Heatmap logs={state.sessionLogs} />
          </article>
          {SUBJECT_KEYS.map((key) => {
            const subject = state.subjects[key];
            const unit = SUBJECTS[key].units[subject.currentUnitIndex]?.title || 'Unit complete — review mode';
            const totalConcepts = SUBJECTS[key].units.reduce((acc, u) => acc + (u.concepts?.length || 0), 0);
            return (
              <article key={key} className="card">
                <h3>{SUBJECTS[key].emoji} {SUBJECTS[key].name}</h3>
                <p><strong>Current unit:</strong> {unit}</p>
                <p><strong>Mastery:</strong> {subject.mastery}%</p>
                <p><strong>Concepts:</strong> {subject.conceptsCompleted.length}/{totalConcepts || 'starter'} completed</p>
                <p><strong>Time:</strong> {subject.timeSpent} mins</p>
              </article>
            );
          })}
        </section>
      )}

      {activeTab === 'parent' && (
        <section className="grid two">
          <article className="card span2">
            <h2>Parent Snapshot</h2>
            <p>Raleigh is currently at <strong>{level.name}</strong> with <strong>{totalMastery}% average mastery</strong>.</p>
            <p>Weekly goal: <strong>{state.weeklyCompleted}/5 days</strong> {state.weeklyCompleted >= 5 ? '✅ unlocked!' : 'in progress'}.</p>
            <button className="secondary" onClick={() => exportData(state)}>Export Progress JSON</button>
          </article>
          <article className="card">
            <h3>Badges</h3>
            <div className="badges">
              {state.badges.length ? state.badges.map((b) => <span className="badge" key={b}>{b}</span>) : <p>No badges yet — first session unlocks one!</p>}
            </div>
          </article>
          <article className="card">
            <h3>Recent Sessions</h3>
            <ul>
              {state.sessionLogs.slice(0, 6).map((log, idx) => (
                <li key={`${log.date}-${idx}`}>{log.date} · {SUBJECTS[log.subject].name} · {log.duration} min · {log.masteryScore}%</li>
              ))}
            </ul>
          </article>
        </section>
      )}
    </main>
  );
}

function QuickReplies({ onAsk, pending }) {
  const prompts = [
    'Can you explain this in a different way?',
    'Give me 3 practice questions.',
    'I think I am ready for a challenge question.',
    'Can we review what I missed?'
  ];

  return (
    <div className="quickReplies">
      {prompts.map((prompt) => (
        <button key={prompt} disabled={pending} onClick={() => onAsk(prompt)}>{prompt}</button>
      ))}
    </div>
  );
}

function Heatmap({ logs }) {
  const done = new Set(logs.map((l) => l.date));
  const cells = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ key, value: done.has(key) ? 1 : 0 });
  }

  return (
    <div className="heatmap">
      {cells.map((cell) => (
        <div key={cell.key} className={`day ${cell.value ? 'on' : ''}`} title={cell.key} />
      ))}
    </div>
  );
}
