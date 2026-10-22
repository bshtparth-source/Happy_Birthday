import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { validateContent } from '../src/config/schema.js';

/**
 * Dev-only Vite plugin for the Content Studio.
 * Exclusively active during development (apply: 'serve').
 * Provides atomic content saving, Sharp image optimization, and staged file handling.
 */
export function studioPlugin() {
  const rootDir = process.cwd();
  const contentPath = path.resolve(rootDir, 'src/config/content.json');
  const tmpDir = path.resolve(rootDir, '.studio-tmp');
  const heroDir = path.resolve(rootDir, 'src/assets/images/hero');
  const memoriesDir = path.resolve(rootDir, 'src/assets/images/memories');
  const audioDir = path.resolve(rootDir, 'src/assets/audio');

  // Ensure necessary folders exist
  [tmpDir, heroDir, memoriesDir, audioDir].forEach((d) => {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  });

  return {
    name: 'studio-plugin',
    apply: 'serve',

    configureServer(server) {
      // Security middleware: reject foreign origin headers on mutation requests
      server.middlewares.use((req, res, next) => {
        if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.url.startsWith('/__studio/')) {
          const origin = req.headers.origin;
          const host = req.headers.host;
          if (origin && !origin.includes(host)) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Cross-origin studio requests are prohibited' }));
            return;
          }
        }
        next();
      });

      // 1. GET /__studio/content - fetch current content.json
      server.middlewares.use('/__studio/content', (req, res, next) => {
        if (req.method === 'GET') {
          try {
            const data = fs.readFileSync(contentPath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // 2. POST /__studio/content - validate, save content atomically, and commit staged assets
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);

              // Validate strictly against schema
              const validation = validateContent(parsed);
              if (!validation.valid) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    error: 'Content failed schema validation',
                    details: validation.errors,
                  })
                );
                return;
              }

              // Move any staged files from .studio-tmp into src/assets/
              if (fs.existsSync(tmpDir)) {
                const stagedFiles = fs.readdirSync(tmpDir);
                stagedFiles.forEach((file) => {
                  const srcFile = path.join(tmpDir, file);
                  let destDir = memoriesDir;
                  if (file.startsWith('hero-')) {
                    destDir = heroDir;
                  } else if (file.endsWith('.mp3') || file.endsWith('.m4a')) {
                    destDir = audioDir;
                  }
                  fs.copyFileSync(srcFile, path.join(destDir, file));
                  fs.unlinkSync(srcFile);
                });
              }

              // Write content.json atomically using temporary swap file with 2-space indentation
              const tempPath = `${contentPath}.${Date.now()}.tmp`;
              fs.writeFileSync(tempPath, JSON.stringify(parsed, null, 2), 'utf-8');
              fs.renameSync(tempPath, contentPath);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });

      // 3. POST /__studio/upload-photo - processes images with sharp
      server.middlewares.use('/__studio/upload-photo', (req, res, next) => {
        if (req.method !== 'POST') return next();

        const chunks = [];
        let totalSize = 0;
        const MAX_SIZE = 15 * 1024 * 1024; // 15 MB limit

        req.on('data', (chunk) => {
          totalSize += chunk.length;
          if (totalSize > MAX_SIZE) {
            res.statusCode = 413;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'File size exceeds 15 MB limit.' }));
            req.destroy();
            return;
          }
          chunks.push(chunk);
        });

        req.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks);
            const image = sharp(buffer);
            const meta = await image.metadata();

            // Validate true file format
            const allowed = ['jpeg', 'png', 'webp'];
            if (!meta.format || !allowed.includes(meta.format)) {
              res.statusCode = 415;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error:
                    'Unsupported image format. Please upload JPG, PNG, or WebP. (For HEIC, export as JPG).',
                })
              );
              return;
            }

            const isHero = req.url.includes('type=hero');
            const fileId = `${isHero ? 'hero' : 'memory'}-${crypto.randomBytes(4).toString('hex')}`;
            const fileName = `${fileId}.webp`;
            const outPath = path.join(tmpDir, fileName);

            // Strip metadata (GPS/EXIF), auto-orient via .rotate(), output WebP (quality 80)
            const targetWidth = isHero ? 600 : 800;
            await sharp(buffer)
              .rotate()
              .resize({ width: targetWidth, withoutEnlargement: true })
              .webp({ quality: 80 })
              .toFile(outPath);

            const stat = fs.statSync(outPath);
            const sizeKb = Math.round(stat.size / 1024);

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                id: fileId,
                fileName,
                previewUrl: `/__studio/tmp/${fileName}`,
                sizeKb,
                warning: sizeKb > 300 ? 'Image exceeds 300 KB budget.' : null,
              })
            );
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Image processing error: ${err.message}` }));
          }
        });
      });

      // 4. GET /__studio/tmp/* - serve staged files to the preview
      server.middlewares.use('/__studio/tmp', (req, res, next) => {
        if (req.method === 'GET') {
          const fileName = decodeURIComponent(req.url.replace(/^\//, ''));
          const filePath = path.join(tmpDir, fileName);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            if (fileName.endsWith('.webp')) res.setHeader('Content-Type', 'image/webp');
            if (fileName.endsWith('.mp3')) res.setHeader('Content-Type', 'audio/mpeg');
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }
        next();
      });
    },
  };
}
