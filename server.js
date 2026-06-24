require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Fail fast if the JWT secrets are missing — the API is insecure without them.
for (const key of ['JWT_SECRET', 'INVITE_SECRET']) {
  if (!process.env[key]) {
    console.error(`[boot] Missing required env var: ${key}`);
    process.exit(1);
  }
}

(async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`[boot] API listening on http://localhost:${PORT}`);
  });

  // Graceful shutdown.
  const shutdown = (signal) => {
    console.log(`\n[boot] ${signal} received, shutting down...`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();
