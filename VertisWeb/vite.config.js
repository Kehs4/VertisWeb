import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redireciona requisições que começam com /api para o seu backend
      '/api': {
        target: 'http://localhost:9000', // O endereço do seu servidor Express
        changeOrigin: true, // Necessário para o proxy funcionar corretamente
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api do caminho final
      },
    },
  },
});
