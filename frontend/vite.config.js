import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

function copyABIsPlugin() {
  return {
    name: 'copy-abis',
    buildStart() {
      // Puedes agregar más ABIs aquí si lo necesitas
      const abis = [
        {
          src: path.resolve(__dirname, '../contracts/finance/LoanManager.sol'),
          artifact: path.resolve(__dirname, '../artifacts/contracts/finance/LoanManager.sol/LoanManager.json'),
          dest: path.resolve(__dirname, 'src/artifacts/LoanManager.json')
        }
      ];
      abis.forEach(({ artifact, dest }) => {
        if (fs.existsSync(artifact)) {
          fs.copyFileSync(artifact, dest);
          console.log('ABI copiado a', dest);
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}']
      },
      manifest: {
        name: 'BrainSafes',
        short_name: 'BrainSafes',
        description: 'Gestión segura y descentralizada de credenciales',
        theme_color: '#1976d2',
        icons: [
          {
            src: '/brain.svg',
            sizes: '120x120',
            type: 'image/svg+xml'
          }
        ]
      }
    }),
    copyABIsPlugin()
  ],
  test: {
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'html'],
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Deshabilitar sourcemaps para reducir tamaño
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
          wallet: ['@reown/appkit/react', '@reown/appkit-adapter-wagmi', 'wagmi', 'viem'],
          utils: ['@tanstack/react-query', 'react-router-dom', 'react-i18next']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material', '@mui/icons-material']
  }
})