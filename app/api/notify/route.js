export async function POST(req) {
  try {
    const body = await req.json();
    const { email, status, streak, weeklyCompleted } = body || {};

    const summary = {
      email,
      subject: 'Alpha Learning Daily Summary',
      status: status || 'Not yet started ⏳',
      streak: streak || 0,
      weeklyCompleted: weeklyCompleted || 0,
      sentAt: new Date().toISOString(),
    };

    const webhookUrl = process.env.PARENT_NOTIFY_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary),
      });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && email) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: email,
          subject: 'Alpha Learning Daily Summary',
          text: `${summary.status}\nStreak: ${summary.streak}\nThis week: ${summary.weeklyCompleted}/5`,
        }),
      });
    }

    return Response.json({ ok: true, summary });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'notify_failed' }, { status: 500 });
  }
}
