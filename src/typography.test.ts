/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const mojibake = /\u00e1[\u00bb\u00ba]|\u00c3[\u0080-\u00bf]|\u00c4[\u0080-\u00bf]|\u00c6[\u0080-\u00bf]|\u00e2[\u0080\u20ac]/u;

function uiFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return uiFiles(path);
    return /\.(tsx?|css|json|html|svg|mjs)$/.test(entry.name) ? [path] : [];
  });
}

it('keeps Vietnamese UI source in valid UTF-8 and NFC', () => {
  const files = [...uiFiles('src'), ...uiFiles('public'), ...uiFiles('scripts'), 'index.html'];
  const decoder = new TextDecoder('utf-8', { fatal: true });
  for (const file of files) {
    const text = decoder.decode(readFileSync(file));
    expect(text, file).not.toContain('\uFFFD');
    // Valid UTF-8/NFC can still contain text that was decoded twice.
    expect(text, file).not.toMatch(mojibake);
    expect(text.normalize('NFC'), file).toBe(text);
  }
  expect(readFileSync('index.html', 'utf8')).toContain('lang="vi"');
});

it('detects common double-decoded accents and punctuation', () => {
  for (const bad of ['\u00e1\u00bb\u00a5', '\u00e2\u20ac\u201c', '\u00e2\u20ac\u201d']) expect(bad).toMatch(mojibake);
  expect('Giáo xứ Đức Mỹ – Giáo phận Bà Rịa — Phụng vụ').not.toMatch(mojibake);
});
