import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/<JoshTest>/', // Replace <repository-name> with the name of your GitHub repository
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
