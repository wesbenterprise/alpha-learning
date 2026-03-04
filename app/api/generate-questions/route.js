import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

/**
 * AI Question Generation
 * POST /api/generate-questions
 * Body: { conceptId, conceptTitle, explanation, subject, count, seenQuestions }
 * Returns: { questions: [{prompt, choices, answer, type}] }
 */
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    conceptId,
    conceptTitle,
    explanation,
    subject,
    count = 5,
    seenQuestions = [],
  } = body;

  if (!client) {
    return NextResponse.json({ questions: [] });
  }

  const subjectContext = {
    math: 'Use concrete, real-world scenarios (shopping at Publix, distances in Florida, cooking, sports scores). Include specific numbers.',
    ela: 'Include short reading passages or scenarios. Use names like Raleigh, Jake, Maya. Make it relatable to a 10-year-old.',
    science: 'Use examples from Florida\'s environment (Everglades, hurricanes, manatees, beaches). Include everyday phenomena.',
    social: 'Reference Florida and South Carolina history, US government, or current events kids might know about.',
  }[subject] || 'Make questions concrete and relatable to a 10-year-old in 5th grade.';

  const seenNote = seenQuestions.length > 0
    ? `Do NOT generate questions similar to these already-seen ones:\n${seenQuestions.slice(-5).map((q, i) => `${i+1}. ${q}`).join('\n')}`
    : '';

  const prompt = `Generate ${count} multiple-choice questions for a 5th-grade student about: "${conceptTitle}"

Concept explanation: ${explanation}

Requirements:
- Every question must have a SPECIFIC, UNAMBIGUOUS correct answer
- NO vague prompts like "describe" or "explain in your own words" — everything is multiple choice with one clear right answer
- Real-world context is great: "A box of cereal costs $4.59 and another costs $4.52. Which costs more?"
- 3 answer choices per question (A, B, C)
- One clearly correct answer, two plausible but wrong distractors
- Age-appropriate language for a 10-year-old
- ${subjectContext}
${seenNote}

Return ONLY valid JSON (no markdown, no explanation):
{
  "questions": [
    {
      "prompt": "Question text here",
      "choices": ["Choice A", "Choice B", "Choice C"],
      "answer": "The exact text of the correct choice",
      "type": "multiple-choice"
    }
  ]
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);
    const questions = (parsed.questions || []).map(q => ({
      prompt: q.prompt,
      choices: q.choices,
      answer: q.answer,
      type: q.type || 'multiple-choice',
      generated: true,
    }));

    return NextResponse.json({ questions });
  } catch (err) {
    console.error('Question generation error:', err.message);
    return NextResponse.json({ questions: [], error: err.message });
  }
}
