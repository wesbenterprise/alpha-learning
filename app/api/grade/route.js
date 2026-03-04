const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

function safeJsonParse(raw) {
  if (!raw) return null;
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

function keywordFallback(correctAnswer = '', studentAnswer = '') {
  const clean = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9\s/.%-]/g, ' ');
  const expected = clean(correctAnswer).split(/\s+/).filter((w) => w.length >= 3);
  const student = clean(studentAnswer);

  if (!student.trim()) {
    return { correct: false, score: 0, feedback: 'Give it a try in your own words so I can help you improve it.' };
  }

  if (!expected.length) {
    return { correct: false, score: 40, feedback: 'Nice effort. Add one key fact from the lesson to strengthen your answer.' };
  }

  const matches = expected.filter((k) => student.includes(k));
  const ratio = matches.length / expected.length;
  const score = Math.max(0, Math.min(100, Math.round(ratio * 100)));

  if (ratio >= 0.7) {
    return { correct: true, score: Math.max(score, 80), feedback: 'Great thinking — you captured the key idea clearly.' };
  }
  if (ratio >= 0.35) {
    return { correct: false, score: Math.max(score, 55), feedback: 'Good start. You have part of it — add the main detail from the model answer.' };
  }
  return { correct: false, score: Math.min(score, 45), feedback: 'Nice effort, but this answer is off-topic or missing key ideas. Let’s focus on the main concept.' };
}

async function gradeWithClaude(payload) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('missing_anthropic_key');

  const system = `You grade 5th-grade student short answers. Be encouraging, specific, and honest.
Return STRICT JSON only:
{"correct": boolean, "score": number, "feedback": string}
Rules:
- Score 0-100.
- Give partial credit for partial understanding.
- Reject gibberish/off-topic answers (score under 30, correct=false).
- “correct” should usually mean score >= 75 and concept understanding is present.
- feedback max 2 sentences, warm tone, and include one concrete improvement when not fully correct.`;

  const user = {
    subject: payload.subject,
    concept: payload.concept,
    question: payload.question,
    correctAnswer: payload.correctAnswer,
    studentAnswer: payload.studentAnswer,
  };

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      temperature: 0.2,
      system,
      messages: [{ role: 'user', content: JSON.stringify(user) }],
    }),
  });

  if (!response.ok) {
    throw new Error(`anthropic_${response.status}`);
  }

  const data = await response.json();
  const text = data?.content?.find((c) => c.type === 'text')?.text || '';
  const parsed = safeJsonParse(text);
  if (!parsed) throw new Error('bad_model_json');

  const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
  return {
    correct: Boolean(parsed.correct),
    score,
    feedback: String(parsed.feedback || 'Nice effort. Keep going!').slice(0, 300),
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { question, correctAnswer, studentAnswer, subject = 'math', concept = '' } = body || {};

    if (!question || !correctAnswer || typeof studentAnswer !== 'string') {
      return Response.json({ error: 'invalid_payload' }, { status: 400 });
    }

    try {
      const graded = await gradeWithClaude({ question, correctAnswer, studentAnswer, subject, concept });
      return Response.json(graded);
    } catch {
      return Response.json(keywordFallback(correctAnswer, studentAnswer));
    }
  } catch (error) {
    return Response.json({ error: error?.message || 'grade_failed' }, { status: 500 });
  }
}
