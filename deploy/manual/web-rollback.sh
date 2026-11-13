#!/usr/bin/env bash
set -euo pipefail
BASE=${DUCMY_WEB_BASE:-/opt/ducmy/web}
SHA=${1:?Usage: web-rollback.sh PREVIOUS_COMMIT_SHA}
[[ "$SHA" =~ ^[0-9a-f]{40}$ && -s "$BASE/releases/$SHA/index.html" ]] || { echo 'Unknown release.' >&2; exit 1; }
ASSET=$(grep -oE '/assets/[^" ]+\.(js|css)' "$BASE/releases/$SHA/index.html" | head -n 1 || true)
[[ -n "$ASSET" && -s "$BASE/releases/$SHA$ASSET" ]] || { echo 'Release asset missing.' >&2; exit 1; }
exec 9>"$BASE/deploy.lock"
flock -n 9 || exit 1
OLD=$(readlink "$BASE/current" || true)
ln -sfn "releases/$SHA" "$BASE/current.next"
mv -Tf "$BASE/current.next" "$BASE/current"
if ! curl --fail --silent --show-error http://127.0.0.1:8080/ | cmp -s "$BASE/releases/$SHA/index.html" - ||
   ! curl --fail --silent --show-error "http://127.0.0.1:8080$ASSET" | cmp -s "$BASE/releases/$SHA$ASSET" -; then
  if [[ -n "$OLD" ]]; then
    ln -sfn "$OLD" "$BASE/current.next"
    mv -Tf "$BASE/current.next" "$BASE/current"
    OLD_ASSET=$(grep -oE '/assets/[^" ]+\.(js|css)' "$BASE/current/index.html" | head -n 1 || true)
    if [[ "$(readlink "$BASE/current" || true)" != "$OLD" || -z "$OLD_ASSET" || ! -s "$BASE/current$OLD_ASSET" ]] ||
       ! curl --fail --silent --show-error http://127.0.0.1:8080/ | cmp -s "$BASE/current/index.html" - ||
       ! curl --fail --silent --show-error "http://127.0.0.1:8080$OLD_ASSET" | cmp -s "$BASE/current$OLD_ASSET" -; then
      echo 'ROLLBACK FAILED: previous release is not verified.' >&2
    else
      echo 'Previous Web release restored and verified.' >&2
    fi
  else
    rm -f "$BASE/current"
  fi
  exit 1
fi
echo "Web release active: $SHA"
