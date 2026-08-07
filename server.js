const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// Real Live SMTP Mailer Endpoint
app.post('/api/send-email', async (req, res) => {
  const { host, port, user, pass, recipient, subject, body } = req.body;

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

  try {
    console.log(`[SMTP Mailer] Sending live email via ${smtpHost}:${smtpPort} to ${targetRecipient}...`);
    const info = await transporter.sendMail({
      from: `"TaskPulse Reminders" <${smtpUser}>`,
      to: targetRecipient,
      subject: subject || 'TaskPulse Task Reminder',
      html: body || '<p>Task Reminder Alert</p>'
    });

    console.log(`[SMTP Mailer] SUCCESS: Email delivered to ${targetRecipient}. ID: ${info.messageId}`);
    res.json({ success: true, message: `Email delivered to ${targetRecipient}` });
  } catch (error) {
    console.error(`[SMTP Mailer Error]`, error);
    res.status(500).json({ success: false, error: error.message || 'SMTP Authentication / Delivery failed' });
  }
});

app.listen(PORT, () => {
  console.log(`[TaskPulse Server] Express running on http://localhost:${PORT}`);
  console.log(`[SMTP Mailer] Nodemailer active on http://localhost:${PORT}/api/send-email`);
});
