import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // loadEnv reads .env.development (or .env.production) so vite.config.ts
  // can forward /api/* to the right backend without exposing the URL to the bundle.
  const env = loadEnv(mode, process.cwd(), '');
  const devBackend = env.VITE_API_URL ?? 'http://localhost:3001';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@scientia/validators': resolve(__dirname, '../../packages/validators/src/index.ts'),
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        // In dev, /api/* → backend (strips /api prefix before forwarding).
        // In production, Vercel's rewrite rule in vercel.json does the same job.
        '/api': {
          target: devBackend,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
