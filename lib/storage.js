import { BADGE_RULES, LEVELS, SUBJECTS } from './curriculum';
import { supabase } from './supabase';

const STORAGE_KEY = 'alpha-learning-state-v3';

function allConcepts(subjectKey) {
  return SUBJECTS[subjectKey].units.flatMap((u) => u.concepts || []);
}

const baseSubjects = Object.keys(SUBJECTS).reduce((acc, key) => {
  const conceptMap = {};
  for (const c of allConcepts(key)) {
    conceptMap[c.id] = {
      title: c.title,
      unit: SUBJECTS[key].units.find((u) => (u.concepts || []).some((cc) => cc.id === c.id))?.title || '',
      status: 'not_started',
      bestScore: 0,
      attempts: 0,
      lastScore: 0,
      lastPracticed: null,
      timeSpent: 0,
    };
  }

  acc[key] = {
    mastery: 0,
    timeSpent: 0,
    conceptsCompleted: [],
    currentUnitIndex: 0,
    currentConceptIndex: 0,
    conceptMap,
  };
  return acc;
}, {});

export const initialState = {
  startedAt: new Date().toISOString(),
  sessionLogs: [],
  streak: 0,
  longestStreak: 0,
  freezeDaysPerWeek: 2,
  freezeDaysUsedThisWeek: 0,
  freezeUsageByWeek: {},
  lastCompletionDate: null,
  totalMinutes: 0,
  weeklyCompleted: 0,
  badges: [],
  hasCompletedToday: false,
  profile: {
    id: null,
    name: '',
    grade: '5',
    avatar: '🦊',
    theme: 'amber',
    startSubject: 'math',
    parentEmail: '',
    onboardingComplete: false,
  },
  parentStatus: 'Not yet started ⏳',
  subjects: baseSubjects,
};

export function loadState() {
  if (typeof window === 'undefined') return initialState;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialState;

  try {
    const parsed = JSON.parse(saved);
    return {
      ...initialState,
      ...parsed,
      profile: { ...initialState.profile, ...(parsed.profile || {}) },
      subjects: Object.keys(baseSubjects).reduce((acc, key) => {
        acc[key] = {
          ...baseSubjects[key],
          ...(parsed.subjects?.[key] || {}),
          conceptMap: {
            ...baseSubjects[key].conceptMap,
            ...(parsed.subjects?.[key]?.conceptMap || {}),
          },
        };
        return acc;
      }, {}),
    };
  } catch {
    return initialState;
  }
}

export function saveState(state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getLevel(totalMastery) {
  const sorted = [...LEVELS].sort((a, b) => a.min - b.min);
  return sorted.reduce((curr, next) => (totalMastery >= next.min ? next : curr), sorted[0]);
}

function isWeekday(d) {
  const day = d.getDay();
  return day >= 1 && day <= 5;
}

function weekKey(date) {
  const d = new Date(date);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export function computeStreakState(logs, freezeDaysPerWeek = 2, now = new Date()) {
  const completionDates = new Set(logs.map((l) => l.date));
  if (!logs.length) {
    return { currentStreak: 0, longestStreak: 0, freezeUsageByWeek: {}, freezeDaysUsedThisWeek: 0 };
  }

  const sortedDates = [...completionDates].sort();
  const start = new Date(`${sortedDates[0]}T00:00:00`);
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);

  let streak = 0;
  let longest = 0;
  let consecutiveUnfrozenMisses = 0;
  const freezeUsageByWeek = {};

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (!isWeekday(d)) continue;
    const ds = d.toISOString().slice(0, 10);
    const done = completionDates.has(ds);
    const wk = weekKey(d);
    if (!freezeUsageByWeek[wk]) freezeUsageByWeek[wk] = 0;

    if (done) {
      streak += 1;
      consecutiveUnfrozenMisses = 0;
    } else if (freezeUsageByWeek[wk] < freezeDaysPerWeek) {
      freezeUsageByWeek[wk] += 1;
      streak += 1;
      consecutiveUnfrozenMisses = 0;
    } else {
      consecutiveUnfrozenMisses += 1;
      if (consecutiveUnfrozenMisses >= 2) streak = 0;
    }

    longest = Math.max(longest, streak);
  }

  const thisWeekKey = weekKey(now);
  return {
    currentStreak: streak,
    longestStreak: longest,
    freezeUsageByWeek,
    freezeDaysUsedThisWeek: freezeUsageByWeek[thisWeekKey] || 0,
  };
}

export function weeklyCompletionCount(logs) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return new Set(
    logs
      .filter((log) => {
        const d = new Date(`${log.date}T00:00:00`);
        return d >= monday && d <= friday;
      })
      .map((log) => log.date)
  ).size;
}

export function computeBadges(state) {
  return BADGE_RULES.filter((badge) => badge.matcher(state)).map((badge) => badge.id);
}

export function recomputeSubjectMastery(subjectState) {
  const concepts = Object.values(subjectState.conceptMap || {});
  if (!concepts.length) return 0;
  const mastered = concepts.filter((c) => c.status === 'mastered').length;
  return Math.round((mastered / concepts.length) * 100);
}

export async function syncStateToSupabase(state) {
  if (!supabase || typeof window === 'undefined' || !navigator.onLine || !state.profile?.name) return;

  try {
    let userId = state.profile.id;
    if (!userId) {
      const { data: inserted } = await supabase
        .from('users')
        .insert({ name: state.profile.name, grade: state.profile.grade })
        .select('id')
        .single();
      userId = inserted?.id;
    } else {
      await supabase.from('users').upsert({ id: userId, name: state.profile.name, grade: state.profile.grade });
    }

    if (!userId) return;

    const latest = state.sessionLogs[0];
    if (latest) {
      await supabase.from('sessions').upsert({
        id: `${userId}-${latest.date}-${latest.subject}-${latest.conceptId}`,
        user_id: userId,
        date: latest.date,
        subject: latest.subject,
        duration_seconds: latest.duration * 60,
        concepts_covered: [latest.conceptId],
        score: latest.score,
      });
    }

    const conceptRows = Object.entries(state.subjects).flatMap(([subject, data]) =>
      Object.entries(data.conceptMap || {}).map(([conceptId, c]) => ({
        user_id: userId,
        concept_id: conceptId,
        subject,
        status: c.status,
        best_score: c.bestScore || 0,
        attempts: c.attempts || 0,
        last_attempted: c.lastPracticed,
      }))
    );

    if (conceptRows.length) await supabase.from('concept_progress').upsert(conceptRows, { onConflict: 'user_id,concept_id' });

    await supabase.from('streaks').upsert({
      user_id: userId,
      current_streak: state.streak,
      longest_streak: state.longestStreak,
      last_session_date: state.lastCompletionDate,
    }, { onConflict: 'user_id' });

    const badgeRows = (state.badges || []).map((badge) => ({ user_id: userId, badge_id: badge }));
    if (badgeRows.length) await supabase.from('badges').upsert(badgeRows, { onConflict: 'user_id,badge_id' });

    saveState({ ...state, profile: { ...state.profile, id: userId } });
  } catch {
    // Keep localStorage as resilient offline fallback
  }
}

export function exportData(state) {
  const payload = { exportedAt: new Date().toISOString(), ...state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `alpha-learning-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
