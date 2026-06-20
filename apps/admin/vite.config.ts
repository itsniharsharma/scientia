import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@scientia/types': resolve(__dirname, '../../packages/types/src/index.ts'),
      '@scientia/validators': resolve(
        __dirname,
        '../../packages/validators/src/index.ts',
      ),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
