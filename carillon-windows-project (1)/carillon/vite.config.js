import { defineConfig } from 'vite';
export default defineConfig({ base: './', clearScreen: false, server: { strictPort: true, port: 1420 }, build: { outDir: 'dist' } });