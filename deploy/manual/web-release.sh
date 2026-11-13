#!/usr/bin/env bash
set -euo pipefail
umask 077
ARCHIVE=${1:?Usage: web-release.sh ARCHIVE SHA256_FILE}
CHECKSUM=${2:?Usage: web-release.sh ARCHIVE SHA256_FILE}
BASE=${DUCMY_WEB_BASE:-/opt/ducmy/web}
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
[[ -f "$ARCHIVE" && -f "$CHECKSUM" && ! -L "$ARCHIVE" && ! -L "$CHECKSUM" ]] || { echo 'Archive or checksum missing/unsafe.' >&2; exit 1; }
ARCHIVE=$(realpath "$ARCHIVE")
CHECKSUM=$(realpath "$CHECKSUM")
[[ "$(dirname "$ARCHIVE")" == "$(dirname "$CHECKSUM")" && "$(basename "$CHECKSUM")" == "$(basename "$ARCHIVE").sha256" ]] || { echo 'Archive/checksum mismatch.' >&2; exit 1; }
SHA=$(basename "$ARCHIVE" | sed -nE 's/^ducmy-web-([0-9a-f]{40})\.tar\.gz$/\1/p')
[[ -n "$SHA" ]] || { echo 'Invalid release SHA.' >&2; exit 1; }
[[ "$(wc -l < "$CHECKSUM")" -eq 1 && "$(awk 'NR==1 {print $2}' "$CHECKSUM")" == "$(basename "$ARCHIVE")" ]] || { echo 'Invalid checksum manifest.' >&2; exit 1; }
(cd "$(dirname "$ARCHIVE")" && sha256sum -c "$(basename "$CHECKSUM")")
HASH=$(sha256sum "$ARCHIVE" | cut -d ' ' -f 1)
mkdir -p "$BASE/releases"
chmod 755 "$BASE" "$BASE/releases"
exec 9>"$BASE/deploy.lock"
flock -n 9 || { echo 'Another Web deploy is running.' >&2; exit 1; }
TARGET="$BASE/releases/$SHA"
if [[ "$(readlink "$BASE/current" || true)" == "releases/$SHA" ]]; then
  [[ -f "$TARGET/.source-archive.sha256" && "$(cat "$TARGET/.source-archive.sha256")" == "$HASH" ]] || { echo 'Active release differs from archive.' >&2; exit 1; }
  python3 "$SCRIPT_DIR/verify-release-tree.py" "$ARCHIVE" "$TARGET"
  curl --fail --silent --show-error http://127.0.0.1:8080/ | cmp -s "$TARGET/index.html" - || { echo 'Active Web does not serve the release index.' >&2; exit 1; }
  echo "Web release already active: $SHA"; exit 0
fi
if [[ -e "$TARGET" ]]; then
  [[ -d "$TARGET" && ! -L "$TARGET" && -f "$TARGET/.source-archive.sha256" && "$(cat "$TARGET/.source-archive.sha256")" == "$HASH" ]] || { echo 'Existing release is incomplete or differs; refusing overwrite.' >&2; exit 1; }
  python3 "$SCRIPT_DIR/verify-release-tree.py" "$ARCHIVE" "$TARGET"
else
  TMP=$(mktemp -d "$BASE/releases/.${SHA}.tmp.XXXXXXXX")
  trap 'rm -rf -- "$TMP"' EXIT
  python3 "$SCRIPT_DIR/validate-archive.py" "$ARCHIVE" "$TMP"
  [[ -s "$TMP/index.html" && -s "$TMP/robots.txt" && -s "$TMP/sitemap.xml" ]] || { echo 'Incomplete Web artifact.' >&2; exit 1; }
  ASSET=$(grep -oE '/assets/[^" ]+\.(js|css)' "$TMP/index.html" | head -n 1 || true)
  [[ -n "$ASSET" && -s "$TMP$ASSET" ]] || { echo 'Missing referenced Web asset.' >&2; exit 1; }
  printf '%s\n' "$HASH" > "$TMP/.source-archive.sha256"
  find "$TMP" -type d -exec chmod 755 {} +
  find "$TMP" -type f -exec chmod 644 {} +
  mv -T "$TMP" "$TARGET"
  trap - EXIT
fi
ASSET=$(grep -oE '/assets/[^" ]+\.(js|css)' "$TARGET/index.html" | head -n 1 || true)
[[ -n "$ASSET" && -s "$TARGET$ASSET" ]] || { echo 'Missing referenced Web asset.' >&2; exit 1; }
OLD=$(readlink "$BASE/current" || true)
ln -sfn "releases/$SHA" "$BASE/current.next"
mv -Tf "$BASE/current.next" "$BASE/current"
rollback() {
  if [[ -n "$OLD" ]]; then
    ln -sfn "$OLD" "$BASE/current.next"
    mv -Tf "$BASE/current.next" "$BASE/current"
    sudo systemctl reload nginx || true
    curl --fail --silent --show-error http://127.0.0.1:8080/ | cmp -s "$BASE/current/index.html" - || echo 'Previous Web smoke also failed.' >&2
  else
    rm -f "$BASE/current"
  fi
  echo 'Web smoke failed; previous release restored if available.' >&2
  exit 1
}
sudo nginx -t && sudo systemctl reload nginx || rollback
curl --fail --silent --show-error http://127.0.0.1:8080/ | cmp -s "$TARGET/index.html" - || rollback
curl --fail --silent --show-error "http://127.0.0.1:8080$ASSET" | cmp -s "$TARGET$ASSET" - || rollback
echo "Web release active: $SHA"
