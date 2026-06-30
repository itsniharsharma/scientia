import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
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
      port: 3004,
      strictPort: true,
      proxy: {
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
      sourcemap: false,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'vendor-store': ['zustand'],
            'vendor-katex': ['katex'],
            'vendor-charts': ['recharts'],
          },
        },
      },
    },
  };
});
