require('dotenv').config();
const path = require('path');
const express = require('express');

const app = express();
app.use(express.json());

app.use('/api/bootstrap', require('./routes/bootstrap'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/jamiya', require('./routes/jamiya'));
app.use('/api/goal-plan', require('./routes/goalPlan'));
app.use('/api/goal-schedule', require('./routes/goalSchedule'));

// Serve the existing static frontend (project root) from the same origin/port.
const FRONTEND_ROOT = path.join(__dirname, '..');
app.use(express.static(FRONTEND_ROOT));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Centralized JSON error handler — no stack traces leak to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`ريالك server running at http://localhost:${PORT}`);
  console.log(`Open: http://localhost:${PORT}/Reyalak%20App%20-%20AI%20Insights.html`);
});
