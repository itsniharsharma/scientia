import app from './app';
import { logger } from './shared/logger';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  logger.info('Backend started', { port: PORT, env: process.env.NODE_ENV ?? 'development' });
});
