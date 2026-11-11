#!/usr/bin/env bash
set -euo pipefail
umask 077
ARCHIVE=${1:?Usage: web-release.sh ARCHIVE SHA256_FILE}
CHECKSUM=${2:?Usage: web-release.sh ARCHIVE SHA256_FILE}
BASE=/opt/ducmy/web
[[ -f "$ARCHIVE" && -f "$CHECKSUM" ]] || { echo 'Archive or checksum missing.' >&2; exit 1; }
[[ "$(realpath -m "$(dirname "$ARCHIVE")")" == "$(realpath -m "$(dirname "$CHECKSUM")")" ]] || { echo 'Archive and checksum must be in the same directory.' >&2; exit 1; }
cd "$(dirname "$ARCHIVE")"
[[ "$(basename "$CHECKSUM")" == "$(basename "$ARCHIVE").sha256" ]] || { echo 'Checksum filename does not match archive.' >&2; exit 1; }
[[ "$(awk 'NR==1 {print $2}' "$CHECKSUM")" == "$(basename "$ARCHIVE")" && "$(wc -l < "$CHECKSUM")" -eq 1 ]] || { echo 'Checksum does not name this archive.' >&2; exit 1; }
sha256sum -c "$(basename "$CHECKSUM")"
SHA=$(basename "$ARCHIVE" | sed -nE 's/^ducmy-web-([0-9a-f]{40})\.tar\.gz$/\1/p')
[[ -n "$SHA" ]] || { echo 'Invalid commit SHA in archive name.' >&2; exit 1; }
exec 9>"$BASE/deploy.lock"
flock -n 9 || exit 1
TARGET="$BASE/releases/$SHA"
[[ ! -e "$TARGET" ]] || { echo 'Release already exists; refusing overwrite.' >&2; exit 1; }
mkdir -p "$TARGET"
python3 "$BASE/manual/validate-archive.py" "$ARCHIVE" "$TARGET"
[[ -s "$TARGET/index.html" && -s "$TARGET/robots.txt" && -s "$TARGET/sitemap.xml" ]] || { echo 'Incomplete static artifact.' >&2; exit 1; }
ASSET=$(grep -oE '/assets/[^" ]+\.(js|css)' "$TARGET/index.html" | head -n 1 || true)
[[ -n "$ASSET" && -s "$TARGET$ASSET" ]] || { echo 'Missing referenced Web asset.' >&2; exit 1; }
find "$TARGET" -type d -exec chmod 755 {} +
find "$TARGET" -type f -exec chmod 644 {} +
OLD=$(readlink "$BASE/current" || true)
ln -sfn "releases/$SHA" "$BASE/current.next"
mv -Tf "$BASE/current.next" "$BASE/current"
if ! sudo nginx -t || ! sudo systemctl reload nginx || ! curl --fail --silent --show-error http://127.0.0.1:8080/ >/dev/null || ! curl --fail --silent --show-error "http://127.0.0.1:8080$ASSET" >/dev/null; then
  if [[ -n "$OLD" ]]; then ln -sfn "$OLD" "$BASE/current.next"; mv -Tf "$BASE/current.next" "$BASE/current"; sudo systemctl reload nginx; else rm -f "$BASE/current"; fi
  echo 'Web failed local smoke; previous symlink restored if available.' >&2
  exit 1
fi
echo "Web release active: $SHA"
