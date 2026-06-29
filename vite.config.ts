import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Relative base + HashRouter keeps this working on GitHub Pages
// no matter what the repo is named, with no server rewrites needed.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'MyFirstBaby',
        short_name: 'MyFirstBaby',
        description: 'Our pregnancy & first-year companion',
        theme_color: '#7c9885',
        background_color: '#faf8f5',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})
