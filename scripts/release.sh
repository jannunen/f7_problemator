#!/usr/bin/env bash
#
# One release, three targets.
#
# The web app, the iOS build and the Android build all come from the same
# `npm run build` output in www/. This script is the single place a version is
# decided, so those three can never disagree.
#
# It replaces deploy.sh, which had three silent failure modes:
#
#   1. it wrote the backend's APP_VERSION to ../backend/.env — a path that does
#      not exist from this repo, so the sync never happened and the backend has
#      been advertising 0.8.10 while the app moved to 1.4.x
#   2. it targeted LINE 6 of that file, but APP_VERSION is on line 7. Had the
#      path resolved, it would have overwritten PWA_URL instead
#   3. it edited package.json by line number, which any reformatting breaks
#      without a word
#
# Nothing here edits by line number, and every step that can fail, stops.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Where the Laravel .env lives. Override when it is somewhere else:
#   BACKEND_ENV=/path/to/.env ./scripts/release.sh 1.4.2
BACKEND_ENV="${BACKEND_ENV:-/var/sites/problemator_backend/.env}"

NEW_VERSION="${1:-}"
if [ -z "$NEW_VERSION" ]; then
  CURRENT=$(node -p "require('./package.json').version")
  echo "Current version: $CURRENT"
  read -r -p "New version (x.y.z): " NEW_VERSION
fi

if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "error: '$NEW_VERSION' is not x.y.z" >&2
  exit 1
fi

# The stores need a monotonically increasing integer. Same rule as
# src/js/version.js: 1.4.2 -> 10402, and minor/patch must stay under 100.
BUILD_NUMBER=$(node -e "
  const [a,b,c] = process.argv[1].split('.').map(Number);
  if (b > 99 || c > 99) { console.error('minor and patch must be < 100 for a monotonic build number'); process.exit(1); }
  console.log(a*10000 + b*100 + c);
" "$NEW_VERSION")

echo "==> Releasing $NEW_VERSION (build $BUILD_NUMBER)"

if [ -n "$(git status --porcelain)" ]; then
  echo "error: working tree is dirty. Commit or stash first." >&2
  exit 1
fi

echo "==> Checks"
npm run lint
npm test

echo "==> Version"
node -e "
  const fs = require('fs');
  const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  p.version = process.argv[1];
  fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
" "$NEW_VERSION"
echo "    package.json -> $NEW_VERSION"

# The backend advertises the latest MOBILE version so the app can offer an
# update. Matched by key, never by line number, and it is an error if the file
# or the key is missing rather than a silent no-op.
if [ ! -f "$BACKEND_ENV" ]; then
  echo "error: backend env not found at $BACKEND_ENV" >&2
  echo "       set BACKEND_ENV=/path/to/.env and re-run" >&2
  exit 1
fi
if ! grep -q '^APP_VERSION=' "$BACKEND_ENV"; then
  echo "error: no APP_VERSION key in $BACKEND_ENV" >&2
  exit 1
fi
sed -i.bak -E "s|^APP_VERSION=.*|APP_VERSION=$NEW_VERSION|" "$BACKEND_ENV"
rm -f "$BACKEND_ENV.bak"
echo "    $BACKEND_ENV -> APP_VERSION=$NEW_VERSION"

echo "==> Build (this artifact serves web, iOS and Android)"
npm run build

# Only sync the native shells if they exist — the web app releases on its own
# schedule and must not be blocked on them.
if [ -d "ios" ] || [ -d "android" ]; then
  echo "==> Native"
  npx cap sync
  echo "    build number for the stores: $BUILD_NUMBER"
  echo "    (open the projects to archive/upload when you are ready to submit)"
else
  echo "==> Native: no ios/ or android/ yet, skipping"
fi

echo "==> Commit and tag"
git add package.json
git commit -m "chore: $NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Problemator mobile $NEW_VERSION (build $BUILD_NUMBER)"

echo "==> Deploy web"
rsync -avzh --delete www/ api3.problemator.fi:mobile/www

cat <<DONE

Released $NEW_VERSION.

  web     live now
  stores  build $BUILD_NUMBER is staged in www/; submit when you choose

Not pushed. When you are ready:
  git push && git push --tags
DONE
