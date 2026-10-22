import { defineConfig } from 'vite';
import { studioPlugin } from './tools/studio-plugin.js';

export default defineConfig({
  plugins: [
    studioPlugin(),
    {
      name: 'preview-studio-guard',
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/studio')) {
            res.statusCode = 404;
            res.end('404 Not Found');
            return;
          }
          next();
        });
      },
    },
  ],
  build: {
    target: 'es2022',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
});
