import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

/**
 * AI Answer Grading
 * POST /api/grade
 * Body: { question, expectedAnswer, studentAnswer, subject }
 */
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { question, expectedAnswer, studentAnswer, subject } = body;

  if (!studentAnswer || studentAnswer.trim().length === 0) {
    return NextResponse.json({ correct: false, feedback: "Please write an answer before submitting!", gibberish: false });
  }

  // Gibberish / too short check
  const cleaned = studentAnswer.trim();
  if (cleaned.length < 2) {
    return NextResponse.json({ correct: false, feedback: "Try writing a bit more — what do you think the answer is?", gibberish: true });
  }

  // Gibberish pattern: keyboard mash
  const gibberishPattern = /^[qwrtpsdfghjklzxcvbnm]{6,}$/i;
  if (gibberishPattern.test(cleaned.replace(/\s/g, ''))) {
    return NextResponse.json({ correct: false, feedback: "Hmm, that doesn't look like a real answer. Give it your best shot!", gibberish: true });
  }

  // Try AI grading
  if (client) {
    try {
      const prompt = `You are grading a 5th-grade student's answer.

Question: ${question}
Expected correct answer: ${expectedAnswer}
Student's answer: "${studentAnswer}"
Subject: ${subject || 'general'}

Grade the student's answer:
1. Is it correct or mostly correct? Award credit for correct understanding even if phrasing differs or there are spelling mistakes.
2. Is it complete gibberish, random letters, or clearly not an attempt?
3. Provide brief, encouraging feedback (1-2 sentences max) appropriate for a 10-year-old.

Respond with JSON only:
{
  "correct": true/false,
  "gibberish": true/false,
  "feedback": "Your encouraging feedback here"
}`;

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          correct: !!result.correct,
          feedback: result.feedback || '',
          gibberish: !!result.gibberish,
        });
      }
    } catch (err) {
      console.error('AI grading error, falling back:', err.message);
    }
  }

  // Keyword fallback
  return keywordGrade(studentAnswer, expectedAnswer);
}

function keywordGrade(studentAnswer, expectedAnswer) {
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const studentNorm = normalize(studentAnswer);
  const expectedNorm = normalize(expectedAnswer);

  // Direct or near match
  if (studentNorm === expectedNorm) {
    return NextResponse.json({ correct: true, feedback: 'Great job! That\'s exactly right! 🌟', gibberish: false });
  }

  // Check if student answer contains key words from the expected answer
  const expectedWords = expectedNorm.split(/\s+/).filter(w => w.length > 3);
  const matchCount = expectedWords.filter(w => studentNorm.includes(w)).length;
  const matchRatio = expectedWords.length > 0 ? matchCount / expectedWords.length : 0;

  if (matchRatio >= 0.6) {
    return NextResponse.json({ correct: true, feedback: 'Good thinking — that captures the main idea! ✅', gibberish: false });
  }

  return NextResponse.json({ correct: false, feedback: `Not quite — the answer was: ${expectedAnswer}. Keep going! 💪`, gibberish: false });
}
