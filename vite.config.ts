import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/dashboard/', // <-- Add this line
  plugins: [react()],
  optimizeDeps: {
    include: ['lucide-react']
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true
  }
});
