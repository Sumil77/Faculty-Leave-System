import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    verbose : true,
    host: '0.0.0.0',
    port: 3001,
    strictPort: true,
    allowedHosts: [
      '0822-38-254-174-96.ngrok-free.app', // Your specific Ngrok URL
      '.ngrok-free.app', // Allow all Ngrok subdomains dynamically
    ],
    cors: true, // Enable CORS
    proxy: {
      '/api': 'http://localhost:5000', // adjust port if needed
    }
  },
});
