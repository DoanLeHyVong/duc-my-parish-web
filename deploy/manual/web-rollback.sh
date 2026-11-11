#!/usr/bin/env bash
set -euo pipefail
BASE=/opt/ducmy/web
SHA=${1:?Usage: web-rollback.sh PREVIOUS_COMMIT_SHA}
[[ "$SHA" =~ ^[0-9a-f]{40}$ && -s "$BASE/releases/$SHA/index.html" ]] || { echo 'Unknown release.' >&2; exit 1; }
exec 9>"$BASE/deploy.lock"
flock -n 9 || exit 1
OLD=$(readlink "$BASE/current" || true)
ln -sfn "releases/$SHA" "$BASE/current.next"
mv -Tf "$BASE/current.next" "$BASE/current"
if ! sudo nginx -t || ! sudo systemctl reload nginx || ! curl --fail --silent --show-error http://127.0.0.1:8080/ >/dev/null; then
  if [[ -n "$OLD" ]]; then ln -sfn "$OLD" "$BASE/current.next"; mv -Tf "$BASE/current.next" "$BASE/current"; sudo systemctl reload nginx; else rm -f "$BASE/current"; fi
  exit 1
fi
echo "Web release active: $SHA"
