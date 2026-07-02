// Single-process entry point for Render free tier
// Boots gateway + all workers in one process

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException] non-fatal, continuing:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection] non-fatal, continuing:', reason);
});

import './gateway/server';
import './fleet/worker';
import './workers/inboundProcessor';
import './workers/releaseReservation';
import './workers/embedProduct';
