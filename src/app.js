import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { verifyOrigin } from './middleware/csrf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  // crossOriginResourcePolicy relaxed so Next can render /uploads images.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.webOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  if (!env.isProduction) app.use(morgan('dev'));

  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

  // Cookie-authenticated writes must declare a trusted origin. Mounted after
  // the body parsers so rejected requests are still fully read, and before the
  // routes so it covers every write including uploads.
  app.use('/api', verifyOrigin, routes);

  // Express 5 / path-to-regexp v8: a bare '*' throws. Use a named splat.
  app.use('/{*splat}', notFound);
  app.use(errorHandler);

  return app;
}
