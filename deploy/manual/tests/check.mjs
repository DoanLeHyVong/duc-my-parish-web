import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const shell = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';

test('CI cannot start an automatic deployment or publish an image', () => {
  const workflow = readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8');
  assert.match(workflow, /branches: \[main\]/);
  assert.doesNotMatch(workflow, /staging/);
  assert.doesNotMatch(workflow, /workflow_run|ssh-action|scp-action|build-push-action|docker\/login-action/);
  assert.match(workflow, /if: github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/);
});

test('Web release fails closed without a checksum', () => {
  const script = path.join(root, 'deploy/manual/web-release.sh');
  const result = spawnSync(shell, [script, 'missing.tar.gz', 'missing.sha256'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing/i);
});

test('rollback refuses an unknown Web release', () => {
  const script = path.join(root, 'deploy/manual/web-rollback.sh');
  const result = spawnSync(shell, [script, 'invalid'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown/i);
});

test('Nginx serves a dynamic sitemap and marks Admin as noindex', () => {
  const nginx = readFileSync(path.join(root, 'deploy/manual/ducmy-web.nginx.conf'), 'utf8');
  assert.match(nginx, /location = \/sitemap\.xml[\s\S]*?proxy_pass http:\/\/127\.0\.0\.1:5000\/api\/v1\/public\/sitemap\.xml/);
  assert.match(nginx, /location \/admin[\s\S]*?X-Robots-Tag "noindex, nofollow"/);
});

test('production delivery checks secrets and release content before succeeding', () => {
  const workflow = readFileSync(path.join(root, '.github/workflows/deploy-production.yml'), 'utf8');
  const release = readFileSync(path.join(root, 'deploy/manual/web-release.sh'), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /contents: read/);
  assert.ok(workflow.indexOf('Missing $variable') < workflow.indexOf('scp "${ssh_opts'));
  assert.match(workflow, /StrictHostKeyChecking=yes/);
  assert.match(workflow, /scp[^\n]*deploy\/manual\/web-release\.sh deploy\/manual\/validate-archive\.py deploy\/manual\/verify-release-tree\.py/);
  assert.match(workflow, /bash \/opt\/ducmy\/web\/incoming\/\$\{GITHUB_SHA\}\/web-release\.sh/);
  assert.match(release, /verify-release-tree\.py/);
  assert.match(release, /cmp -s "\$TARGET\/index\.html"/);
  assert.doesNotMatch(release, /\bsudo\b/);
  assert.match(release, /Previous Web release restored and verified/);
  assert.match(release, /ROLLBACK FAILED/);
  assert.doesNotMatch(readFileSync(path.join(root, 'deploy/manual/web-rollback.sh'), 'utf8'), /\bsudo\b/);
});
