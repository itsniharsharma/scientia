import app from './app';
import { logger } from './shared/logger';

const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  logger.error('Missing required environment variables — refusing to start', { missing });
  process.exit(1);
}

if (!['development', 'production', 'test'].includes(process.env.NODE_ENV ?? '')) {
  logger.error('NODE_ENV must be development, production, or test');
  process.exit(1);
}

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  logger.info('Backend started', { port: PORT, env: process.env.NODE_ENV ?? 'development' });
});
