import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      JWT_SECRET: 'test-secret-not-for-production',
    },
    alias: {
      '@scientia/types': resolve(__dirname, '../packages/types/src/index.ts'),
      '@scientia/validators': resolve(__dirname, '../packages/validators/src/index.ts'),
    },
  },
});
