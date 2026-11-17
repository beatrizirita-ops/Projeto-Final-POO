import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy de desenvolvimento: a tela chama /lancamentos e o Vite repassa ao backend (porta 3000)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/contas': 'http://localhost:3000',
      '/lancamentos': 'http://localhost:3000',
      '/resumo': 'http://localhost:3000',
      '/relatorio': 'http://localhost:3000',
      '/categorias': 'http://localhost:3000',
      '/orcamentos': 'http://localhost:3000',
    },
  },
});
