const strip = (value) => String(value || '').trim().replace(/^["']|["']$/g, '');

const apiKey = strip(process.env.MAILGUN_API_KEY);
const domain = strip(process.env.MAILGUN_DOMAIN);
const baseUrl = (strip(process.env.MAILGUN_BASE_URL) || 'https://api.mailgun.net').replace(/\/+$/, '');
const senderName = strip(process.env.MAILGUN_SENDER_NAME) || 'CampusBite';
const fromAddress = strip(process.env.MAILGUN_FROM_EMAIL) || (domain ? `campusbite@${domain}` : '');

const hasMailgunConfig = !!apiKey && !!domain;

if (!hasMailgunConfig) {
  console.warn(
    '[Startup] Mailgun is disabled because MAILGUN_API_KEY or MAILGUN_DOMAIN is missing.'
  );
}

export const sendEmail = async (to, subject, html) => {
  if (!hasMailgunConfig) {
    return null;
  }

  const body = new URLSearchParams({
    from: `${senderName} <${fromAddress}>`,
    to: Array.isArray(to) ? to.join(',') : to,
    subject,
    html,
  });

  try {
    const response = await fetch(`${baseUrl}/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      },
      body,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Mailgun ${response.status}: ${result.message || response.statusText}`);
    }

    console.log('Email sent:', result.id);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
