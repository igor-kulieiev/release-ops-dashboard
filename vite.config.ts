import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// No backend to proxy to — every /api call is served in-browser by the Mock Service Worker
// handlers in src/mocks/ (see main.tsx).
export default defineConfig({
	plugins: [react(), tailwindcss()],
	// Mirrors tsconfig paths so imports read @/… instead of ../../…
	resolve: { alias: { '@': '/src' } },
});
