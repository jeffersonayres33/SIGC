import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const repo = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '';
  
  // Determine base path for GitHub Pages:
  // - If repository ends with '.github.io' (user/org root site), base is '/'
  // - If it's a project repository (e.g. /sigc/), base is '/repo-name/'
  // - For local dev or default, use './'
  let base = './';
  if (process.env.NODE_ENV === 'production') {
    if (repo) {
      if (repo.toLowerCase().endsWith('.github.io')) {
        base = '/';
      } else {
        base = `/${repo}/`;
      }
    } else {
      base = '/';
    }
  }

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
