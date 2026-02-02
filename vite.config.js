import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: false,
  server: {
    port: 5173,
    open: true,
    cors: true,
    strictPort: false,
    hmr: {
      overlay: false
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*'
    }
  },
  preview: {
    port: 4173,
    strictPort: false,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  optimizeDeps: {
    exclude: []
  }
});
