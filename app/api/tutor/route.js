import { SUBJECTS } from '@/lib/curriculum';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function getCurrentConcept(subjectKey, unitIndex, conceptIndex) {
  const subject = SUBJECTS[subjectKey];
  const unit = subject?.units?.[unitIndex] || subject?.units?.[0];
  const concept = unit?.concepts?.[conceptIndex] || unit?.concepts?.[0];
  return { subject, unit, concept };
}

function fallbackTutor({ concept, unit, phase = 'introduction', message = '' }) {
  if (!concept) return 'Great work today. Let\'s do a spiral review next session.';

  const intro = [
    `Topic: ${unit.title} — ${concept.title}`,
    concept.explanation,
    '',
    'Let\'s start with one quick check:',
    concept.questions?.[0]?.prompt || 'Tell me what part feels easiest so far.',
  ].join('\n');

  const reteach = [
    `Nice effort. Let\'s look at ${concept.title} one more way.`,
    'Think step by step and focus on the key idea before choosing an answer.',
    concept.questions?.[1]?.prompt || concept.questions?.[0]?.prompt || 'Try again in your own words.',
  ].join('\n');

  if (phase === 'reteach' || /wrong|miss|review|different/i.test(message)) return reteach;
  return intro;
}

async function callOpenAI(messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

async function gradeFreeText({ prompt, rubric, expectedAnswer, studentAnswer, subject, conceptTitle }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const normalized = (studentAnswer || '').trim().toLowerCase();
    const expected = (expectedAnswer || '').trim().toLowerCase();
    const correct = expected && normalized.includes(expected.slice(0, Math.min(12, expected.length)));
    return {
      correct,
      feedback: correct
        ? 'Great explanation. You captured the main idea.'
        : 'Nice try. Include the key idea from the concept and be specific.',
    };
  }

  const system = `You grade short answers for a bright 5th grader. Return strict JSON only: {"correct": boolean, "feedback": string}. Keep feedback under 2 sentences, warm and concrete.`;
  const user = {
    subject,
    conceptTitle,
    prompt,
    rubric,
    expectedAnswer,
    studentAnswer,
  };

  const raw = await callOpenAI([
    { role: 'system', content: system },
    { role: 'user', content: JSON.stringify(user) },
  ]);

  try {
    const parsed = JSON.parse(raw);
    return {
      correct: Boolean(parsed.correct),
      feedback: parsed.feedback || 'Good effort — let\'s refine this answer.',
    };
  } catch {
    return {
      correct: /correct|yes|right/i.test(raw || ''),
      feedback: raw || 'Good effort — let\'s refine this answer.',
    };
  }
}

export async function POST(req) {
  const body = await req.json();

  if (body.mode === 'grade_free_text') {
    const result = await gradeFreeText(body);
    return Response.json(result);
  }

  const {
    subject = 'math',
    unitIndex = 0,
    conceptIndex = 0,
    chat = [],
    message = '',
    phase = 'introduction',
    recentWrongAnswers = [],
  } = body;

  const { subject: subjectData, unit, concept } = getCurrentConcept(subject, unitIndex, conceptIndex);

  if (!concept) {
    return Response.json({
      reply: `Awesome consistency. You have finished the core concepts in ${SUBJECTS[subject]?.name || 'this subject'}.`,
    });
  }

  const systemPrompt = `You are a patient, encouraging tutor for a bright 5th grader named Raleigh. Use Socratic method on wrong answers. Keep explanations concrete with real-world examples. Never condescending.
Stay on the current concept.
Keep responses concise (2-4 sentences, unless asking a question).
Session phase rules:
- introduction: teach first, then ask one check-for-understanding question.
- guided_practice: step-by-step coaching.
- independent_practice: brief feedback + hint, not full solution.
- mastery_check: no hints; only short correct/incorrect feedback.
- reteach: different explanation style than before, more concrete.
`;

  const contextBlock = {
    subject: subjectData?.name,
    unit: unit?.title,
    concept: concept?.title,
    conceptExplanation: concept?.explanation,
    phase,
    questionsAsked: concept?.questions?.length || 0,
    recentWrongAnswers,
  };

  const windowedChat = (chat || []).slice(-10).map((m) => ({ role: m.role, content: m.text }));

  let reply = null;
  try {
    reply = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'system', content: `Current context: ${JSON.stringify(contextBlock)}` },
      ...windowedChat,
      ...(message ? [{ role: 'user', content: message }] : []),
    ]);
  } catch {
    reply = null;
  }

  if (!reply) {
    reply = fallbackTutor({ concept, unit, phase, message });
  }

  return Response.json({
    reply,
    conceptId: concept.id,
    conceptTitle: concept.title,
    questionCount: concept.questions?.length || 0,
  });
}
