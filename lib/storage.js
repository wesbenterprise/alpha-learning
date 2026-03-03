import { BADGE_RULES, LEVELS, SUBJECTS } from './curriculum';

const STORAGE_KEY = 'alpha-learning-state-v2';

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

export function updateStreak(_prevDate, logs) {
  if (!logs.length) return 0;
  const unique = [...new Set(logs.map((l) => l.date))].sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  let cursor = new Date();

  for (const ds of unique) {
    const d = new Date(`${ds}T00:00:00`);
    const diff = Math.round((new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()) - d) / 86400000);
    if (diff === 0 || diff === 1 || (diff <= 3 && !isWeekday(cursor))) {
      streak += 1;
      cursor = d;
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
