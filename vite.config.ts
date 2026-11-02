
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/commitly/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'Payments — gestione pagamenti',
        short_name: 'Payments',
        description: 'Abbonamenti e pagamenti ricorrenti, salvati in locale.',
        theme_color: '#101411',
        background_color: '#101411',
        display: 'standalone',
        start_url: '/commitly/',
        scope: '/commitly/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        navigateFallback: '/commitly/index.html'
      }
    })
  ]
})
