import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { pluginContenu } from './src/content/node/vite-plugin';

// `base` : chemin de publication (GitHub Pages sert l'app sous /<nom-du-dépôt>/).
const base = process.env.BASE_PATH ?? '/';
const racineProjet = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base,
  plugins: [
    react(),
    pluginContenu({ racineProjet }),
    VitePWA({
      // Mise à jour sur demande (bandeau « Nouvelle version ») : jamais de rechargement forcé.
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Révision PSE',
        short_name: 'Révision PSE',
        description: 'Révision PSE1 et PSE2 : fiches, QCM et cas pratiques, hors connexion.',
        lang: 'fr',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F4F2F8',
        theme_color: '#6A55B5',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
});
