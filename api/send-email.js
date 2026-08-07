const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let bodyData = req.body || {};
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch (e) {}
    }

    const { host, port, user, pass, recipient, subject, body } = bodyData;

    const smtpHost = host || process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(port || process.env.SMTP_PORT || 587);
    const smtpUser = user || process.env.SMTP_USER || 'krishnarohith417@gmail.com';
    const smtpPass = pass || process.env.SMTP_PASS || 'beblzukehtmmiitg';
    const targetRecipient = recipient || process.env.SMTP_USER || 'krishnarohith417@gmail.com';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: `"TaskPulse Reminders" <${smtpUser}>`,
      to: targetRecipient,
      subject: subject || 'TaskPulse Task Reminder',
      html: body || '<p>Task Reminder Alert</p>'
    });

    return res.status(200).json({ success: true, message: `Email delivered to ${targetRecipient}` });
  } catch (error) {
    console.error('[Vercel SMTP Error]', error);
    return res.status(500).json({ success: false, error: error.message || 'SMTP Authentication / Delivery failed' });
  }
};
