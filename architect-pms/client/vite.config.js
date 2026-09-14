import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  let apiTarget = env.VITE_API_TARGET || env.VITE_SERVER_BASE_URL;

  if (!apiTarget && env.VITE_API_BASE_URL && env.VITE_API_BASE_URL.startsWith('http')) {
    try {
      const url = new URL(env.VITE_API_BASE_URL);
      apiTarget = url.origin;
    } catch (e) {
      // ignore parsing error
    }
  }

  if (!apiTarget) {
    apiTarget = 'http://localhost:5004';
  }

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});


