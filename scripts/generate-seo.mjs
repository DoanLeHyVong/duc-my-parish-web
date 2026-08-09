import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const loaded = loadEnv(mode, process.cwd(), '');
const siteUrl = String(process.env.VITE_SITE_URL || loaded.VITE_SITE_URL || '').replace(/\/$/, '');
const output = resolve(process.cwd(), 'dist');

await mkdir(output, { recursive: true });

if (!siteUrl) {
  await writeFile(resolve(output, 'robots.txt'), 'User-agent: *\nAllow: /\n', 'utf8');
  console.warn('VITE_SITE_URL chưa được đặt; bỏ qua sitemap khi build.');
  process.exit(0);
}

const paths = ['/', '/gioi-thieu', '/gio-le', '/su-kien', '/thu-vien', '/lien-he'];
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...paths.map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`),
  '</urlset>',
  '',
].join('\n');

await Promise.all([
  writeFile(resolve(output, 'sitemap.xml'), sitemap, 'utf8'),
  writeFile(resolve(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`, 'utf8'),
]);
