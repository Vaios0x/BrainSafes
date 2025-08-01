import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import fs from 'fs';
import path from 'path';

function copyABIsPlugin() {
  return {
    name: 'copy-abis',
    buildStart() {
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

// Configuración de producción sin PWA para evitar errores de tamaño
export default defineConfig({
  plugins: [
    react(),
    svgr(),
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
    sourcemap: false, // Deshabilitar sourcemaps en producción
    rollupOptions: {
      output: {
        // Separar Reown AppKit en su propio chunk
        manualChunks: {
          'reown-appkit': ['@reown/appkit/react', '@reown/appkit-adapter-wagmi'],
          'wagmi': ['wagmi', 'viem'],
          'react-query': ['@tanstack/react-query'],
          'mui': ['@mui/material', '@mui/icons-material'],
          'vendor': ['react', 'react-dom', 'react-router-dom']
        },
        // Configuración para chunks más pequeños
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    // Aumentar el límite de advertencia de tamaño
    chunkSizeWarningLimit: 2000,
    // Optimizaciones adicionales
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
    },
  },
  // Optimización de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@reown/appkit/react',
      '@reown/appkit-adapter-wagmi',
      'wagmi',
      'viem',
      '@tanstack/react-query'
    ],
    exclude: ['@reown/appkit/networks']
  }
}) 