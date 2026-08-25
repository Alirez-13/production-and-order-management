import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDb } from './server/db';
import { apiRouter } from './server/routes';
import { errorHandler } from './server/middleware/errorHandler';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  app.use(express.json());

  // Initialize SQLite database
  await initDb();
  console.log('[Server] SQLite Database ready and seeded.');

  // Mount API Router
  app.use('/api', apiRouter);

  // Global Error Handler for API
  app.use(errorHandler);

  // Vite middleware for development / static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Factory MES API and UI running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Fatal Error]:', err);
});
