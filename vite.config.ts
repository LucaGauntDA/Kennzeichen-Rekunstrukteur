import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    // WICHTIG: Ersetze 'kennzeichen-visualizer' durch deinen Repository-Namen auf GitHub!
    // Wenn dein Repo z.B. 'mein-projekt' heißt, muss hier '/mein-projekt/' stehen.
    base: '/kennzeichen-visualizer/',
    define: {
      // Dies sorgt dafür, dass process.env.API_KEY im Code funktioniert
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    }
  };
});