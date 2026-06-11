const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const {
  getMembersWithMostDenials,
  getHourlyBreakdown,
  getSuspiciousActivity,
} = require('./analyzer');

const app = express();
app.use(cors());
app.use(express.json());

const LOGS_PATH = path.resolve(__dirname, '..', 'logs.json');

function loadLogs() {
  // Leer y parsear; si falla, lanzar error para que la ruta responda 500
  const raw = fs.readFileSync(LOGS_PATH, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const msg = `Invalid logs.json: ${err && err.message}`;
    console.error('Error parsing logs.json:', msg);
    throw new Error(msg);
  }

  if (!Array.isArray(parsed)) {
    const msg = 'logs.json does not contain a JSON array';
    console.error(msg);
    throw new Error(msg);
  }

  return parsed;
}

app.get('/members/most-denials', (req, res) => {
  try {
    const topNque = parseInt(req.query.topN, 10) || 5;
    const logs = loadLogs();
    const members = getMembersWithMostDenials(logs, topNque);
    res.json({ topNque, members });
  } catch (err) {
    console.error('Failed to load logs in /members/most-denials:', err && err.message);
    res.status(500).json({ error: 'Failed to load logs', detail: err.message });
  }
});

app.get('/hourly-breakdown', (req, res) => {
  try {
    const logs = loadLogs();
    const breakdown = getHourlyBreakdown(logs);
    res.json({ breakdown });
  } catch (err) {
    console.error('Failed to load logs in /hourly-breakdown:', err && err.message);
    res.status(500).json({ error: 'Failed to load logs', detail: err.message });
  }
});

app.get('/suspicious', (req, res) => {
  try {
    const maxAttempts = parseInt(req.query.maxAttempts, 10) || 5;
    const windowMinutes = parseInt(req.query.windowMinutes, 10) || 5;
    const logs = loadLogs();
    const incidents = getSuspiciousActivity(logs, maxAttempts, windowMinutes);
    res.json({ maxAttempts, windowMinutes, incidents });
  } catch (err) {
    console.error('Failed to load logs in /suspicious:', err && err.message);
    res.status(500).json({ error: 'Failed to load logs', detail: err.message });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const logs = loadLogs();

    const topDenials = getMembersWithMostDenials(logs, 3);
    const hourlyBreakdown = getHourlyBreakdown(logs);
    const suspiciousActivity = getSuspiciousActivity(logs, 3, 5);

    res.json({
      topDenials,
      hourlyBreakdown,
      suspiciousActivity,
    });
  } catch (err) {
    console.error('Failed to load logs in /api/stats:', err && err.message);
    res.status(500).json({
      error: 'Failed to load logs',
      detail: err.message,
    });
  }
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Basic error handler — returns JSON and avoids raw stack traces in production
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`kiosco-logs server listening on port ${PORT}`);
});

module.exports = app;
