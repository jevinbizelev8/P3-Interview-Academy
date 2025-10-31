import { defineWorkspace } from 'vitest/config';
import path from 'path';

export default defineWorkspace([
  // Client tests - React components with jsdom
  {
    extends: './vite.config.ts',
    test: {
      name: 'client',
      environment: 'jsdom',
      globals: true,
      root: path.resolve(import.meta.dirname, 'client'),
      include: ['src/__tests__/**/*.test.{ts,tsx}'],
      setupFiles: ['src/__tests__/setup.ts'],
    },
  },
  // Server tests - API routes and services with node
  {
    resolve: {
      alias: {
        '@shared': path.resolve(import.meta.dirname, 'shared'),
      },
    },
    test: {
      name: 'server',
      environment: 'node',
      globals: true,
      root: import.meta.dirname,
      include: ['server/__tests__/**/*.test.ts'],
    },
  },
]);
