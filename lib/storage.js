import { BADGE_RULES, LEVELS, SUBJECTS } from './curriculum';

const STORAGE_KEY = 'alpha-learning-state-v1';

const baseSubjects = Object.keys(SUBJECTS).reduce((acc, key) => {
  acc[key] = {
    mastery: 0,
    timeSpent: 0,
    conceptsCompleted: [],
    currentUnitIndex: 0,
    currentConceptIndex: 0,
  };
  return acc;
}, {});

export const initialState = {
  startedAt: new Date().toISOString(),
  sessionLogs: [],
  streak: 0,
  lastCompletionDate: null,
  totalMinutes: 0,
  weeklyCompleted: 0,
  subjects: baseSubjects,
  badges: [],
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
      subjects: {
        ...baseSubjects,
        ...(parsed.subjects || {}),
      },
    };
  } catch (error) {
    console.error('Could not load saved learning state', error);
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

export function updateStreak(prevDate, logs) {
  if (!logs.length) return 0;
  const dates = [...new Set(logs.map((l) => l.date))].sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  let cursor = new Date();

  for (const dateStr of dates) {
    const entryDate = new Date(`${dateStr}T00:00:00`);
    const cursorDate = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    const diffDays = Math.round((cursorDate - entryDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0 || diffDays === 1) {
      streak += 1;
      cursor = new Date(entryDate);
    } else {
      break;
    }
  }

  return streak;
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

  const uniqueDays = new Set(
    logs
      .filter((log) => {
        const d = new Date(`${log.date}T00:00:00`);
        return d >= monday && d <= friday;
      })
      .map((log) => log.date)
  );

  return uniqueDays.size;
}

export function computeBadges(state) {
  return BADGE_RULES.filter((badge) => badge.matcher(state)).map((badge) => badge.id);
}

export function exportData(state) {
  const payload = {
    exportedAt: new Date().toISOString(),
    ...state,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `alpha-learning-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
