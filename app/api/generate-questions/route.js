import { SUBJECTS } from '@/lib/curriculum';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

function getSeedConcept(subjectKey, unitTitle, conceptTitle) {
  const subject = SUBJECTS[subjectKey];
  if (!subject) return null;

  const unit = subject.units.find((u) => u.title === unitTitle) || subject.units[0];
  const concept =
    unit?.concepts?.find((c) => c.title === conceptTitle || c.id === conceptTitle) ||
    unit?.concepts?.[0];

  if (!unit || !concept) return null;
  return { subject, unit, concept };
}

function cleanQuestion(q) {
  if (!q?.question || !q?.correctAnswer) return null;
  const type = q.type === 'free_text' ? 'free_text' : 'multiple_choice';

  if (type === 'multiple_choice') {
    const options = Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : [];
    if (options.length !== 4) return null;
    const answer = String(q.correctAnswer);
    if (!options.includes(answer)) options[0] = answer;
    return {
      question: String(q.question),
      type,
      options,
      correctAnswer: answer,
      explanation: String(q.explanation || ''),
    };
  }

  return {
    question: String(q.question),
    type,
    correctAnswer: String(q.correctAnswer),
    explanation: String(q.explanation || ''),
  };
}

function fallbackQuestions(seedConcept, count = 5) {
  const seed = seedConcept?.concept?.questions || [];
  const mapped = seed.map((q, idx) => ({
    question: q.prompt,
    type: 'multiple_choice',
    options: q.choices || [],
    correctAnswer: q.answer,
    explanation: seedConcept?.concept?.explanation || `Question ${idx + 1}`,
  }));

  const out = [];
  for (let i = 0; i < count; i += 1) {
    out.push(mapped[i % Math.max(1, mapped.length)] || {
      question: `Explain ${seedConcept?.concept?.title || 'the concept'} in your own words.`,
      type: 'free_text',
      correctAnswer: seedConcept?.concept?.explanation || 'A clear explanation of the concept.',
      explanation: 'Use one clear sentence with the key idea.',
    });
  }
  return out;
}

function extractJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {}
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {}
  }
  return null;
}

async function generateWithClaude(payload, seedConcept) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('missing_anthropic_key');

  const system = `Generate age-appropriate 5th grade questions.
Rules:
- Return STRICT JSON only: {"questions":[{"question":string,"type":"multiple_choice"|"free_text","options"?:string[],"correctAnswer":string,"explanation":string}]}
- Count must exactly match requested count.
- Multiple choice MUST have exactly 4 plausible options.
- Include real-world context (Florida, family business, community) where natural.
- Each question should teach, not just test.
- Avoid duplicating previous questions.
- Keep language clear for 5th grade.`;

  const userPrompt = {
    subject: payload.subject,
    unit: payload.unit,
    concept: payload.concept,
    difficulty: payload.difficulty || 'grade_5',
    count: payload.count,
    previousQuestions: payload.previousQuestions || [],
    seedConcept: {
      title: seedConcept?.concept?.title,
      explanation: seedConcept?.concept?.explanation,
      sampleQuestions: seedConcept?.concept?.questions || [],
    },
  };

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1400,
      temperature: 0.7,
      system,
      messages: [{ role: 'user', content: JSON.stringify(userPrompt) }],
    }),
  });

  if (!res.ok) throw new Error(`anthropic_${res.status}`);
  const data = await res.json();
  const text = data?.content?.find((c) => c.type === 'text')?.text || '';
  const parsed = extractJson(text);
  const questions = (parsed?.questions || []).map(cleanQuestion).filter(Boolean);
  if (questions.length < payload.count) throw new Error('insufficient_questions');
  return questions.slice(0, payload.count);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      subject = 'math',
      unit,
      concept,
      difficulty = 'grade_5',
      count = 5,
      previousQuestions = [],
    } = body || {};

    const safeCount = Math.min(10, Math.max(1, Number(count) || 5));
    const seedConcept = getSeedConcept(subject, unit, concept);

    try {
      const questions = await generateWithClaude(
        { subject, unit, concept, difficulty, count: safeCount, previousQuestions },
        seedConcept,
      );
      return Response.json({ questions });
    } catch {
      return Response.json({ questions: fallbackQuestions(seedConcept, safeCount), fallback: true });
    }
  } catch (error) {
    return Response.json({ error: error?.message || 'generate_questions_failed' }, { status: 500 });
  }
}
