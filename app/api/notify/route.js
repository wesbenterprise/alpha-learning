import { NextResponse } from 'next/server';

/**
 * Parent Notification endpoint
 * POST /api/notify
 * Body: { event, data, parentEmail? }
 * Events: 'session-complete', 'daily-reminder', 'weekly-summary', 'badge-earned'
 */
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { event, data } = body;

  // For now, log the notification and return the message content
  // In production, you'd send email via SendGrid/Resend, push via Firebase, etc.
  const message = buildNotificationMessage(event, data);

  console.log('[Notify]', event, message);

  // Could wire up email/SMS here:
  // await sendEmail({ to: parentEmail, subject: message.subject, body: message.body });

  return NextResponse.json({ sent: true, message });
}

function buildNotificationMessage(event, data) {
  const name = data?.studentName || 'Raleigh';
  const subject = data?.subject || '';
  const score = data?.score;
  const streak = data?.streak;
  const badge = data?.badge;

  switch (event) {
    case 'session-complete':
      return {
        subject: `${name} completed today's session! ${score >= 90 ? '🌟' : '✅'}`,
        body: `${name} just finished a ${subject} session with a score of ${score}%${streak ? ` — ${streak}-day streak! 🔥` : ''}. Great work today!`,
        emoji: score >= 90 ? '🌟' : '✅',
        short: `${name} completed today's session — ${score}% in ${subject}${streak ? ` 🔥${streak}` : ''}`,
      };

    case 'badge-earned':
      return {
        subject: `${name} earned a new badge: ${badge?.name}!`,
        body: `${name} just earned the "${badge?.name}" badge ${badge?.emoji}! ${badge?.desc}`,
        emoji: badge?.emoji || '🏅',
        short: `${name} earned "${badge?.name}" ${badge?.emoji}`,
      };

    case 'daily-reminder':
      const hour = new Date().getHours();
      const timeStr = hour >= 12 ? 'this afternoon' : 'today';
      return {
        subject: `⏰ ${name} hasn't done her session yet`,
        body: `Just a heads up — ${name} hasn't completed her learning session ${timeStr}. This is a great time to check in!`,
        emoji: '⏰',
        short: `${name} hasn't started ${timeStr} ⏰`,
      };

    case 'weekly-summary':
      return {
        subject: `📊 ${name}'s weekly learning summary`,
        body: `This week: ${data?.sessionsCompleted}/5 sessions. Strongest subject: ${data?.topSubject}. Overall mastery: ${data?.mastery}%.`,
        emoji: '📊',
        short: `${data?.sessionsCompleted}/5 sessions this week. Mastery: ${data?.mastery}%`,
      };

    default:
      return { subject: 'Alpha Learning update', body: JSON.stringify(data), emoji: '📱', short: 'Update' };
  }
}
