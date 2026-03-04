/**
 * Alpha Learning — Storage Layer
 * localStorage for instant access + Supabase for persistence/cross-device.
 * localStorage is always written first. Supabase syncs asynchronously.
 */

import { getSupabaseClient } from './supabase';

const LS_KEY = 'alpha-learning-state';

// ─── Default State ────────────────────────────────────────────────
export function defaultState() {
  return {
    profile: null, // { name, avatar, createdAt }
    onboarded: false,
    subjects: {
      math:    { mastery: 0, conceptIndex: 0, conceptProgress: {} },
      ela:     { mastery: 0, conceptIndex: 0, conceptProgress: {} },
      science: { mastery: 0, conceptIndex: 0, conceptProgress: {} },
      social:  { mastery: 0, conceptIndex: 0, conceptProgress: {} },
    },
    streak: {
      current: 0,
      longest: 0,
      lastSessionDate: null,  // 'YYYY-MM-DD'
      freezesUsedThisWeek: 0,
      weekStart: null,        // 'YYYY-MM-DD' (Monday)
    },
    badges: [],  // array of badge ids earned
    sessions: [], // recent session logs (last 30)
    settings: {
      parentPin: null,
      sessionDurationMins: 30,
      dailyGoalDays: 5,
      parentEmail: null,
    },
    version: 5,
  };
}

// ─── LocalStorage ─────────────────────────────────────────────────
export function loadState() {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle new fields across versions
    return mergeWithDefaults(parsed, defaultState());
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
  // Fire-and-forget Supabase sync
  syncToSupabase(state).catch(() => {});
}

function mergeWithDefaults(partial, defaults) {
  const result = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (partial[key] !== undefined) {
      if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
        result[key] = mergeWithDefaults(partial[key], defaults[key]);
      } else {
        result[key] = partial[key];
      }
    }
  }
  return result;
}

// ─── Supabase Sync ────────────────────────────────────────────────
async function syncToSupabase(state) {
  const sb = getSupabaseClient();
  if (!sb || !state.profile?.name) return;

  const userId = slugify(state.profile.name);
  const payload = {
    id: userId,
    name: state.profile.name,
    avatar: state.profile.avatar,
    state_json: JSON.stringify(state),
    updated_at: new Date().toISOString(),
  };

  const { error } = await sb
    .from('users')
    .upsert(payload, { onConflict: 'id' });

  if (error) console.warn('Supabase sync error:', error.message);
}

export async function loadFromSupabase(name) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const userId = slugify(name);
  const { data, error } = await sb
    .from('users')
    .select('state_json')
    .eq('id', userId)
    .single();

  if (error || !data?.state_json) return null;
  try {
    return mergeWithDefaults(JSON.parse(data.state_json), defaultState());
  } catch {
    return null;
  }
}

export async function logSessionToSupabase(userId, sessionData) {
  const sb = getSupabaseClient();
  if (!sb) return;

  await sb.from('sessions').insert({
    user_id: userId,
    subject: sessionData.subject,
    concept_id: sessionData.conceptId,
    score: sessionData.score,
    questions_total: sessionData.questionsTotal,
    questions_correct: sessionData.questionsCorrect,
    duration_secs: sessionData.durationSecs,
    mastered: sessionData.mastered,
    created_at: new Date().toISOString(),
  }).catch(() => {});
}

// ─── Streak Logic ─────────────────────────────────────────────────
/**
 * Returns today's date as 'YYYY-MM-DD' in local time
 */
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function getMondayOf(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diff = (day === 0) ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function isWeekend(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function daysBetween(a, b) {
  const da = new Date(a + 'T12:00:00');
  const db = new Date(b + 'T12:00:00');
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

/**
 * Update streak after a completed session.
 * - Weekends don't count (but don't break streak either).
 * - 2 freeze days per week (Mon–Fri only).
 * - One missed weekday uses a freeze automatically if available.
 */
export function updateStreak(streak, today = todayStr()) {
  const s = { ...streak };
  const last = s.lastSessionDate;

  // Reset freeze count if new week
  const thisMonday = getMondayOf(today);
  if (s.weekStart !== thisMonday) {
    s.weekStart = thisMonday;
    s.freezesUsedThisWeek = 0;
  }

  if (!last) {
    // First ever session
    s.current = 1;
    s.longest = 1;
    s.lastSessionDate = today;
    return s;
  }

  if (last === today) {
    // Already completed today
    return s;
  }

  const gap = daysBetween(last, today);

  // Count weekdays in the gap (exclusive of 'last', inclusive of today)
  let weekdayGap = 0;
  let weekendGap = 0;
  for (let i = 1; i <= gap; i++) {
    const d = new Date(last + 'T12:00:00');
    d.setDate(d.getDate() + i);
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (isWeekend(ds)) weekendGap++;
    else weekdayGap++;
  }

  // Weekdays missed (excluding today, which is being completed)
  const weekdaysMissed = weekdayGap - 1; // today counts as completing, not missing

  if (weekdaysMissed <= 0) {
    // Consecutive (possibly through a weekend)
    s.current += 1;
  } else if (weekdaysMissed <= (2 - s.freezesUsedThisWeek)) {
    // Use freeze days to cover missed weekdays
    s.freezesUsedThisWeek += weekdaysMissed;
    s.current += 1;
  } else {
    // Streak broken
    s.current = 1;
  }

  s.longest = Math.max(s.longest, s.current);
  s.lastSessionDate = today;
  return s;
}

/**
 * Whether today's session is completed
 */
export function completedToday(streak) {
  return streak.lastSessionDate === todayStr();
}

// ─── Mastery ──────────────────────────────────────────────────────
export function overallMastery(subjects) {
  const keys = Object.keys(subjects);
  if (!keys.length) return 0;
  const total = keys.reduce((sum, k) => sum + (subjects[k].mastery || 0), 0);
  return Math.round(total / keys.length);
}

export function getLevelInfo(mastery) {
  const levels = [
    { name: 'Explorer',       min: 0,  emoji: '🔭' },
    { name: 'Trailblazer',    min: 15, emoji: '🥾' },
    { name: 'Strategist',     min: 35, emoji: '🧭' },
    { name: 'Scholar',        min: 55, emoji: '📚' },
    { name: 'Mastermind',     min: 75, emoji: '🧠' },
    { name: 'Alpha Achiever', min: 90, emoji: '🏆' },
  ];
  let level = levels[0];
  for (const l of levels) {
    if (mastery >= l.min) level = l;
  }
  const idx = levels.indexOf(level);
  const next = levels[idx + 1];
  const progress = next
    ? Math.round(((mastery - level.min) / (next.min - level.min)) * 100)
    : 100;
  return { ...level, progress, nextLevel: next };
}

// ─── Badge Logic ──────────────────────────────────────────────────
export const BADGE_CATALOG = [
  { id: 'first-session',   name: 'First Steps',      emoji: '👣', desc: 'Complete your first session' },
  { id: 'streak-3',        name: '3-Day Flame',       emoji: '🔥', desc: '3-day streak' },
  { id: 'streak-7',        name: 'Week Warrior',      emoji: '🏆', desc: '7-day streak' },
  { id: 'streak-14',       name: 'On Fire!',          emoji: '⚡', desc: '14-day streak' },
  { id: 'streak-30',       name: '30-Day Legend',     emoji: '🌟', desc: '30-day streak' },
  { id: 'perfect-session', name: 'Perfect Score',     emoji: '💯', desc: 'Get 100% on a session' },
  { id: 'weekly-hero',     name: 'Weekly Hero',       emoji: '🦸', desc: '5/5 weekdays completed' },
  { id: 'math-master',     name: 'Math Wizard',       emoji: '🧮', desc: 'Master 5 math concepts' },
  { id: 'ela-master',      name: 'Bookworm',          emoji: '📖', desc: 'Master 5 ELA concepts' },
  { id: 'science-master',  name: 'Scientist',         emoji: '🔬', desc: 'Master 5 science concepts' },
  { id: 'social-master',   name: 'World Explorer',    emoji: '🗺️', desc: 'Master 5 social studies concepts' },
  { id: 'speed-demon',     name: 'Speed Demon',       emoji: '⚡', desc: 'Finish a session in under 20 min with ≥80%' },
  { id: 'comeback-kid',    name: 'Comeback Kid',      emoji: '💪', desc: 'Pass a concept after failing it first' },
  { id: 'all-rounder',     name: 'All-Rounder',       emoji: '🎯', desc: 'Study all 4 subjects in one week' },
  { id: 'concept-10',      name: '10 Concepts!',      emoji: '🏅', desc: 'Master 10 concepts total' },
  { id: 'concept-25',      name: '25 Concepts!',      emoji: '🥈', desc: 'Master 25 concepts total' },
  { id: 'concept-50',      name: 'Half Century',      emoji: '🥇', desc: 'Master 50 concepts total' },
];

export function checkNewBadges(state, sessionResult) {
  const earned = new Set(state.badges || []);
  const newBadges = [];

  function earn(id) {
    if (!earned.has(id)) {
      earned.add(id);
      const info = BADGE_CATALOG.find(b => b.id === id);
      if (info) newBadges.push(info);
    }
  }

  const totalSessions = (state.sessions || []).length + 1;
  const streak = state.streak?.current || 0;
  const { score, durationSecs, subject } = sessionResult;

  if (totalSessions >= 1)  earn('first-session');
  if (streak >= 3)          earn('streak-3');
  if (streak >= 7)          earn('streak-7');
  if (streak >= 14)         earn('streak-14');
  if (streak >= 30)         earn('streak-30');
  if (score === 100)        earn('perfect-session');
  if (durationSecs < 1200 && score >= 80) earn('speed-demon');

  // Count mastered concepts per subject
  for (const subj of ['math', 'ela', 'science', 'social']) {
    const cp = state.subjects?.[subj]?.conceptProgress || {};
    const masteredCount = Object.values(cp).filter(v => v === 'mastered').length;
    if (masteredCount >= 5) earn(`${subj}-master`);
  }

  // Total mastered across all subjects
  const totalMastered = ['math', 'ela', 'science', 'social'].reduce((sum, s) => {
    const cp = state.subjects?.[s]?.conceptProgress || {};
    return sum + Object.values(cp).filter(v => v === 'mastered').length;
  }, 0);
  if (totalMastered >= 10) earn('concept-10');
  if (totalMastered >= 25) earn('concept-25');
  if (totalMastered >= 50) earn('concept-50');

  // All-rounder: any 4 subjects studied this week
  const weekSubjects = new Set(
    (state.sessions || [])
      .filter(s => daysBetween(s.date, todayStr()) <= 7)
      .map(s => s.subject)
  );
  weekSubjects.add(subject);
  if (weekSubjects.size >= 4) earn('all-rounder');

  return { newBadges, allBadges: Array.from(earned) };
}

// ─── Recommendation Engine ────────────────────────────────────────
export function getRecommendedSubject(state) {
  const keys = ['math', 'ela', 'science', 'social'];
  const today = todayStr();

  // Score each subject: prefer least recently done + closest to next milestone
  const scored = keys.map(k => {
    const subj = state.subjects[k];
    const mastery = subj?.mastery || 0;
    const milestones = [20, 40, 60, 80, 100];
    const nextMilestone = milestones.find(m => mastery < m) || 100;
    const distToMilestone = nextMilestone - mastery;

    const lastSession = (state.sessions || [])
      .filter(s => s.subject === k)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const daysSinceLastSession = lastSession
      ? daysBetween(lastSession.date, today)
      : 999;

    // Lower score = higher priority
    const score = distToMilestone - (daysSinceLastSession * 2);
    return { key: k, score };
  });

  scored.sort((a, b) => a.score - b.score);
  return scored[0].key;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
}
