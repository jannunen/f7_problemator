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

# The backend advertises the latest mobile version from COMMITTED config, not
# from .env — so it travels with a backend deploy instead of being edited by
# hand per environment. Override the repo location if it differs:
#   BACKEND_REPO=/path/to/backend ./scripts/release.sh 1.4.2
BACKEND_REPO="${BACKEND_REPO:-/var/sites/problemator_backend}"
BACKEND_VERSION_FILE="$BACKEND_REPO/config/mobile.php"

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

# Update the committed backend config. This is a source change in another
# repo, so it is written but NOT committed here — the backend has its own
# review and deploy. Nothing about it is silent: if the file is missing, say so
# and stop, rather than releasing a version the API will never advertise.
if [ ! -f "$BACKEND_VERSION_FILE" ]; then
  echo "error: $BACKEND_VERSION_FILE not found" >&2
  echo "       set BACKEND_REPO=/path/to/backend and re-run" >&2
  exit 1
fi
# POSIX classes, not \s: BSD sed on macOS does not understand \s and would
# silently match nothing — the same class of quiet failure the old deploy.sh had.
if ! grep -qE "^[[:space:]]*'version'[[:space:]]*=>" "$BACKEND_VERSION_FILE"; then
  echo "error: no 'version' key in $BACKEND_VERSION_FILE" >&2
  exit 1
fi
sed -i.bak -E "s|^([[:space:]]*'version'[[:space:]]*=>[[:space:]]*)'[^']*'|\1'$NEW_VERSION'|" "$BACKEND_VERSION_FILE"
rm -f "$BACKEND_VERSION_FILE.bak"
echo "    $BACKEND_VERSION_FILE -> '$NEW_VERSION'"
echo "    NOTE: commit and deploy the backend for the update banner to reach users"

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

The backend's config/mobile.php now reads $NEW_VERSION but is uncommitted.
Commit and deploy the backend, or the in-app update banner will keep
advertising the previous version.
DONE
