import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { pluginContenu } from './src/content/node/vite-plugin';

// `base` : chemin de publication (GitHub Pages sert l'app sous /<nom-du-dépôt>/).
const base = process.env.BASE_PATH ?? '/';
const racineProjet = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base,
  plugins: [react(), pluginContenu({ racineProjet })],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
});
