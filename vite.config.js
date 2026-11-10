import { defineConfig } from 'vite';

// The public preview is served through a tunnel hostname, so Vite must accept
// requests whose Host header is not localhost.
export default defineConfig({
  base: './',
  server: {
    allowedHosts: true,
  },
  preview: {
    allowedHosts: true,
  },
});
