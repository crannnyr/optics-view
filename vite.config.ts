import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' requires the user to accept an update prompt before the new
      // service worker activates — but no prompt UI was ever wired up, so
      // opticsview.store kept serving a months-old cached bundle while new
      // deploys sat unused. autoUpdate + skipWaiting/clientsClaim makes a
      // deploy take effect on the next load instead.
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.jpg'],
      manifest: {
        name: 'OpticsView',
        short_name: 'OpticsView',
        description: 'Smart AI Glasses in Nigeria',
        theme_color: '#0d2818',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-icon.jpg',
            sizes: '192x192',
            type: 'image/jpeg',
          },
          {
            src: '/pwa-icon.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
          {
            src: '/pwa-icon.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Activate a new service worker immediately rather than waiting for
        // every tab to close, and drop stale precaches from older builds.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,woff,woff2}'],
        runtimeCaching: [
          // Supabase API — network first, fall back to cache
          {
            urlPattern: /^https:\/\/dpioixansygkjdbphfdj\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
          // Google Fonts — long-lived cache
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
  ],

  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Split vendor libraries into separate cached chunks.
        // React, Supabase, and Lucide rarely change — once cached by the
        // browser they are never re-downloaded, even across deployments.
        // Only your app code chunk gets re-downloaded when you push updates.
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-icons':    ['lucide-react'],
        },
      },
    },
  },

  // Removed: optimizeDeps.exclude: ['lucide-react']
  // Excluding lucide-react was preventing Vite from pre-bundling it,
  // which caused it to be merged into the app chunk and not cached
  // independently. Removing this lets Vite handle it correctly.
});
