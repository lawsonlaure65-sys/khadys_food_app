
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fix: Simplified Vite config to resolve process.cwd() type error and follow Gemini API guidelines.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
  },
});
