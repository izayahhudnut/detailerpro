import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Pre-bundle lucide-react so its icons are included in the vendor bundle
  optimizeDeps: {
    include: ['lucide-react']
  },
  // Optionally lock the dev server port and auto-open the browser
  server: {
    port: 5173,
    // allow fallback to other ports if 5173 is in use
    strictPort: false,
    open: true
  }
});