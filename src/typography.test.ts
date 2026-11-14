/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

function uiFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return uiFiles(path);
    return /\.(tsx|css)$/.test(entry.name) ? [path] : [];
  });
}

it('keeps Vietnamese UI source in valid UTF-8 and NFC', () => {
  const files = [...uiFiles('src'), 'index.html'];
  const decoder = new TextDecoder('utf-8', { fatal: true });
  for (const file of files) {
    const text = decoder.decode(readFileSync(file));
    expect(text, file).not.toContain('\uFFFD');
    expect(text.normalize('NFC'), file).toBe(text);
  }
  expect(readFileSync('index.html', 'utf8')).toContain('lang="vi"');
});
