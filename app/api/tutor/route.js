import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

/**
 * AI Tutor endpoint
 * POST /api/tutor
 * Body: { message, conceptTitle, subject, wrongAnswer, correctAnswer, mode }
 * Modes: 'explain', 'reteach', 'hint', 'encourage'
 */
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { message, conceptTitle, subject, wrongAnswer, correctAnswer, mode = 'explain' } = body;

  if (!client) {
    return NextResponse.json({
      response: getOfflineFallback(mode, conceptTitle, correctAnswer),
      offline: true,
    });
  }

  const systemPrompt = `You are Remy, a friendly and encouraging AI tutor helping Raleigh (age 10, 5th grade) learn ${subject || 'school subjects'}.

Your personality:
- Warm, encouraging, never condescending
- Explain things with relatable examples (Publix, Florida weather, sports, Roblox)
- Keep responses SHORT (2-4 sentences max) — Raleigh is 10 and has a short attention span
- When she gets something wrong, say "Almost!" or "Good try!" then explain clearly — never "Wrong"
- Use emojis sparingly (1-2 max per response)
- You're her study buddy, not her teacher

Current topic: ${conceptTitle}
Subject: ${subject}`;

  let userMessage = message;

  if (mode === 'reteach' && wrongAnswer && correctAnswer) {
    userMessage = `Raleigh answered "${wrongAnswer}" but the correct answer was "${correctAnswer}" for the concept "${conceptTitle}". Give a short, clear re-explanation using a different example or approach. Keep it under 3 sentences.`;
  } else if (mode === 'hint') {
    userMessage = `Give Raleigh a helpful hint for the question about "${conceptTitle}" without giving away the answer. Keep it encouraging and under 2 sentences.`;
  } else if (mode === 'encourage') {
    userMessage = `Give Raleigh a short, energetic encouragement message (1-2 sentences) to keep going with her learning session on "${conceptTitle}".`;
  } else if (mode === 'explain') {
    userMessage = `Explain "${conceptTitle}" to Raleigh in a fresh, engaging way using a real-world example. Keep it to 3 sentences max.`;
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    return NextResponse.json({
      response: response.content[0]?.text || 'Let\'s keep going! 💪',
      offline: false,
    });
  } catch (err) {
    console.error('Tutor API error:', err.message);
    return NextResponse.json({
      response: getOfflineFallback(mode, conceptTitle, correctAnswer),
      offline: true,
    });
  }
}

function getOfflineFallback(mode, conceptTitle, correctAnswer) {
  const fallbacks = {
    reteach: `Let's look at "${conceptTitle}" one more time! ${correctAnswer ? `The key idea is: ${correctAnswer}` : 'Review the explanation above and try again.'} You've got this! 💪`,
    hint: `Think about what you know about "${conceptTitle}" — the explanation above has the clue you need! 🔍`,
    encourage: `You're doing great! Keep going — every question you answer makes you smarter! 🌟`,
    explain: `Read the explanation carefully — it has everything you need to know about "${conceptTitle}"! 📚`,
  };
  return fallbacks[mode] || fallbacks.encourage;
}
