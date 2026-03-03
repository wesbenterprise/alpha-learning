import { SUBJECTS } from '@/lib/curriculum';

function getCurrentConcept(subjectKey, unitIndex, conceptIndex) {
  const subject = SUBJECTS[subjectKey];
  const unit = subject?.units?.[unitIndex] || subject?.units?.[0];
  const concept = unit?.concepts?.[conceptIndex] || unit?.concepts?.[0];
  return { subject, unit, concept };
}

function scoreConcept(concept, message) {
  if (!concept?.questions?.length) return null;

  // For MVP: infer confidence from user request + deterministic sample score.
  // Replace with LLM grading later.
  const lower = (message || '').toLowerCase();
  const hintMode = lower.includes('review') || lower.includes('different');
  const challengeMode = lower.includes('challenge') || lower.includes('ready');

  let correct = hintMode ? 2 : 3;
  if (challengeMode) correct = 3;

  return {
    total: concept.questions.length,
    correct,
    percent: Math.round((correct / concept.questions.length) * 100),
  };
}

export async function POST(req) {
  const body = await req.json();
  const { subject = 'math', unitIndex = 0, conceptIndex = 0, message = '' } = body;

  const { unit, concept } = getCurrentConcept(subject, unitIndex, conceptIndex);
  if (!concept) {
    return Response.json({
      reply: `Awesome consistency. You have finished the core concepts in ${SUBJECTS[subject].name}. Let's do a spiral review next!`,
    });
  }

  const score = scoreConcept(concept, message);
  const sampleQuestions = concept.questions.map((q, idx) => `${idx + 1}) ${q.prompt}`).join('\n');

  const reply = [
    `Topic: ${unit.title} — ${concept.title}`,
    concept.explanation,
    '',
    'Practice set:',
    sampleQuestions,
    '',
    score?.percent >= 90
      ? "Excellent work — you're above 90% mastery on this concept. Ready to advance."
      : 'Nice effort. Let\'s review and try one more mini-set to hit 90% mastery.',
  ].join('\n');

  return Response.json({
    reply,
    score,
    conceptId: concept.id,
    conceptTitle: concept.title,
  });
}
