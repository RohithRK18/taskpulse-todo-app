const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));

// Serverless SMTP Email API endpoint
const sendEmailHandler = require('./api/send-email');
app.all('/api/send-email', sendEmailHandler);

// Fallback for SPA routing to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Export app for Vercel Serverless Integration
module.exports = app;

// Local development listener
if (require.main === module) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`[TaskPulse Server] Express running at http://localhost:${PORT}`);
  });
}
