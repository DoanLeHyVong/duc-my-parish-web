"""Local artifact and Linux release contract tests; no VPS connection."""
import hashlib
import io
import os
import pathlib
import subprocess
import sys
import tarfile
import tempfile
import unittest

MANUAL = pathlib.Path(__file__).resolve().parents[1]


class ArchiveTests(unittest.TestCase):
    def test_rejects_path_traversal_and_links(self):
        with tempfile.TemporaryDirectory() as root:
            root = pathlib.Path(root)
            for name, kind in [('../escape', 'file'), ('assets/evil', 'symlink')]:
                archive = root / 'test.tar.gz'
                with tarfile.open(archive, 'w:gz') as tar:
                    item = tarfile.TarInfo(name)
                    if kind == 'file':
                        item.size = 1
                        tar.addfile(item, io.BytesIO(b'x'))
                    else:
                        item.type = tarfile.SYMTYPE
                        item.linkname = '../index.html'
                        tar.addfile(item)
                result = subprocess.run([sys.executable, str(MANUAL / 'validate-archive.py'), str(archive), str(root / 'out')], capture_output=True)
                self.assertNotEqual(result.returncode, 0)

    @unittest.skipUnless(sys.platform.startswith('linux'), 'Full release simulation requires Linux')
    def test_retry_and_failed_smoke_preserve_release(self):
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            base = root / 'web'
            (base / 'releases').mkdir(parents=True)
            (base / 'incoming').mkdir()
            old = base / 'releases' / ('a' * 40)
            old.mkdir()
            (old / 'index.html').write_text('old')
            (base / 'current').symlink_to(pathlib.Path('releases') / old.name)
            binary = root / 'bin'
            binary.mkdir()
            for name, body in {
                'sudo': '#!/bin/sh\nexit 0\n',
                'curl': '#!/bin/sh\nif [ "${TEST_BAD_SMOKE:-0}" = 1 ]; then printf wrong; else case "$*" in */assets/*) cat "$DUCMY_WEB_BASE/current/assets/main.js";; *) cat "$DUCMY_WEB_BASE/current/index.html";; esac; fi\n',
            }.items():
                path = binary / name
                path.write_text(body)
                path.chmod(0o755)
            env = {**os.environ, 'PATH': f'{binary}:{os.environ["PATH"]}', 'DUCMY_WEB_BASE': str(base)}

            def archive_for(sha):
                archive = base / 'incoming' / f'ducmy-web-{sha}.tar.gz'
                if not archive.exists():
                    with tarfile.open(archive, 'w:gz') as tar:
                        for name, content in [('index.html', b'<script src="/assets/main.js"></script>'), ('robots.txt', b'robots'), ('sitemap.xml', b'sitemap'), ('assets/main.js', b'new')]:
                            item = tarfile.TarInfo(name)
                            item.size = len(content)
                            tar.addfile(item, io.BytesIO(content))
                digest = hashlib.sha256(archive.read_bytes()).hexdigest()
                checksum = pathlib.Path(str(archive) + '.sha256')
                checksum.write_text(f'{digest}  {archive.name}\n')
                return archive, checksum

            def run(sha, bad=False):
                archive, checksum = archive_for(sha)
                return subprocess.run(['bash', str(MANUAL / 'web-release.sh'), str(archive), str(checksum)], env={**env, 'TEST_BAD_SMOKE': '1' if bad else '0'}, capture_output=True, text=True)

            first = 'b' * 40
            self.assertEqual(run(first).returncode, 0)
            self.assertEqual((base / 'current').resolve(), base / 'releases' / first)
            self.assertEqual(run(first).returncode, 0, 'same artifact must be retry-safe')
            second = 'c' * 40
            self.assertNotEqual(run(second, bad=True).returncode, 0)
            self.assertEqual((base / 'current').resolve(), base / 'releases' / first)


if __name__ == '__main__':
    unittest.main()
