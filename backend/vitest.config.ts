import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Integration tests hit a real remote Postgres instance (Supabase);
    // registration/assignment flows do several sequential round trips
    // (bcrypt hash + multiple queries + a transaction) which can exceed the
    // 5s default under network latency or concurrent test-file load. Unit
    // tests (mocked Prisma) are unaffected — they finish in milliseconds
    // either way.
    testTimeout: 20000,
    hookTimeout: 20000,
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
