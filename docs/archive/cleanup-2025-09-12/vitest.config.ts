import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./client/src/__tests__/setup.ts'],
    include: ['client/src/__tests__/**/*.test.{ts,tsx}'],
    testTimeout: 10000, // Increase test timeout to 10 seconds
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['client/src/**/*.{ts,tsx}'],
      exclude: ['client/src/__tests__/**/*', 'client/src/**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});