import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Playwright specs live in ./e2e and are run by `npm run test:e2e`.
    exclude: ['e2e/**', 'node_modules/**'],
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
