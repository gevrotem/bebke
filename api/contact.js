// Vercel Serverless Function — handles the Bebke contact form.
// Sends the submission to the studio inbox via Resend (https://resend.com).
//
// Required environment variables (set in Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   – API key from your Resend account
//   CONTACT_TO_EMAIL – inbox that should receive submissions (e.g. hello@bebke.com)
//   CONTACT_FROM_EMAIL – optional, defaults to "Bebke Website <onboarding@resend.dev>".
//                        Once you verify a domain in Resend, set this to something like
//                        "Bebke Website <noreply@bebke.com>" for better deliverability.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const name = (body.name || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const phone = (body.phone || '').toString().trim();
  const message = (body.message || '').toString().trim();
  const lang = (body.lang || 'en').toString().trim();

  if (!name || !email) {
    return res.status(400).json({ ok: false, error: 'Name and email are required.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Bebke Website <onboarding@resend.dev>';

  if (!apiKey || !toEmail) {
    console.error('Contact form: missing RESEND_API_KEY or CONTACT_TO_EMAIL env var');
    return res.status(500).json({ ok: false, error: 'Email service is not configured yet.' });
  }

  const escapeHtml = (str) =>
    str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const html = `
    <h2>New enquiry from bebke.${lang === 'he' ? 'co.il' : 'com'}</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone || '—')}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message || '—').replace(/\n/g, '<br/>')}</p>
  `;

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `New wedding enquiry from ${name}`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend API error:', resendRes.status, errText);
      return res.status(502).json({ ok: false, error: 'Failed to send message.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form send failed:', err);
    return res.status(500).json({ ok: false, error: 'Failed to send message.' });
  }
}
