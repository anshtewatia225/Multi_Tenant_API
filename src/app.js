const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const orgRoutes = require('./routes/orgRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security + parsing.
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Trust the first proxy (needed for correct client IPs behind a load balancer,
// which keeps express-rate-limit's IP fallback accurate).
app.set('trust proxy', 1);

app.get('/', (req, res) => res.redirect('/health'));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Feature routes.
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/org', orgRoutes);

// 404 + central error handling (must be last).
app.use(notFound);
app.use(errorHandler);

module.exports = app;
