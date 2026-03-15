import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    // Mock only: 4000. With real AI: set VITE_PROXY_TARGET=8000 then npm run dev (target becomes http://localhost:8000)
    proxy: (() => {
      const raw = process.env.VITE_PROXY_TARGET || '4000';
      const target =
        raw.startsWith('http') ? raw : `http://localhost:${raw.replace(/^localhost:?/, '')}`;
      return {
        '/api': { target, changeOrigin: true },
        '/libs': { target, changeOrigin: true },
      };
    })(),
  },
});
