import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss()
  ],
  server: {
    allowedHosts: [
      'buying-auctions-renewable-partnership.trycloudflare.com'
    ]
  }
});