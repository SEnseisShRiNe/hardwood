import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split large vendor chunks for faster loading
        manualChunks: {
          react:    ['react', 'react-dom'],
          charts:   ['recharts'],
          icons:    ['lucide-react'],
        }
      }
    }
  }
})
