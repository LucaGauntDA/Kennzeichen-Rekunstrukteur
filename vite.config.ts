
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    // Für Netlify (und die meisten anderen Hoster) ist '/' oder './' am besten.
    // GitHub Pages brauchte hier den Repo-Namen, Netlify nicht.
    base: '/',
    define: {
      // Dies sorgt dafür, dass process.env.API_KEY im Code funktioniert
      // Der Key wird beim Build-Prozess von Netlify in den Code "gebacken"
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    }
  };
});
