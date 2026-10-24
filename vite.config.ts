import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
} as Parameters<typeof defineConfig>[0]);
