import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      JWT_SECRET:               'test-secret-not-for-production',
      TELEGRAM_BOT_TOKEN:       '1234567890:AAA_fake_token_for_tests_only',
      TELEGRAM_WEBHOOK_SECRET:  'test-webhook-secret-for-tests',
      TELEGRAM_ALLOWED_USER_IDS: '6388410726',
    },
    alias: {
      '@scientia/types': resolve(__dirname, '../packages/types/src/index.ts'),
      '@scientia/validators': resolve(__dirname, '../packages/validators/src/index.ts'),
    },
  },
});
