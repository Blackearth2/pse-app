import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// `base` : chemin de publication (GitHub Pages sert l'app sous /<nom-du-dépôt>/).
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
});
