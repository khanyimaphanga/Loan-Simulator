import express, { type ErrorRequestHandler } from 'express';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loansRouter } from './routes/loans.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/loans', loansRouter);
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'not_found' });
  });

  // In production the API also serves the built React app.
  const clientDist = resolve(dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => res.sendFile(resolve(clientDist, 'index.html')));
  }

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'invalid_json' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  };
  app.use(onError);

  return app;
}
