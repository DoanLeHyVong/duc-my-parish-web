import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

it('generates only indexable English canonical paths', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'parish-seo-'));
  try {
    await execFileAsync(process.execPath, [resolve('scripts/generate-seo.mjs')], {
      cwd: directory,
      env: { ...process.env, VITE_SITE_URL: 'https://parish.example.org' },
    });
    const sitemap = await readFile(join(directory, 'dist', 'sitemap.xml'), 'utf8');
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(locations).toEqual([
      'https://parish.example.org/',
      'https://parish.example.org/about',
      'https://parish.example.org/mass-schedule',
      'https://parish.example.org/events',
      'https://parish.example.org/gallery',
      'https://parish.example.org/contact',
      'https://parish.example.org/categories/parish-news',
      'https://parish.example.org/categories/announcements',
      'https://parish.example.org/categories/daily-word',
      'https://parish.example.org/categories/diocese-news',
      'https://parish.example.org/categories/bible-study',
      'https://parish.example.org/categories/catechism',
      'https://parish.example.org/privacy',
      'https://parish.example.org/terms',
      'https://parish.example.org/support',
      'https://parish.example.org/data-request',
    ]);
    expect(locations).not.toContain('https://parish.example.org/search');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
