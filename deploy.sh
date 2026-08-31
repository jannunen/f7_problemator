#!/usr/bin/env bash
#
# Manual deploy of the mobile app to production.
#
# Mirrors what .github/workflows/ci.yml does, for the times you need to ship
# without going through CI. Dry-run by default: it shows you exactly what
# would change and transfers nothing until you pass --go.
#
#   ./deploy.sh          # show what would change, transfer nothing
#   ./deploy.sh --go     # actually deploy
#   ./deploy.sh --go --skip-build   # deploy the existing www/ without rebuilding
#
set -euo pipefail

HOST="${DEPLOY_HOST:-api4.problemator.fi}"
USER="${DEPLOY_USER:-$(whoami)}"
PORT="${DEPLOY_PORT:-22}"
TARGET="${DEPLOY_TARGET:-sites/problemator_app}"

GO=0
SKIP_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --go)         GO=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    -h|--help)    sed -n '3,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

cd "$(dirname "$0")"

# The build bakes the API host in at compile time. Without this file the app
# ships pointing at nothing, and the failure is silent until someone opens it.
if [ ! -f .env.production ]; then
  echo "ERROR: .env.production is missing." >&2
  echo "The build reads the API host from it. Without it you would ship an app" >&2
  echo "that talks to nowhere, and nothing would fail until a climber opened it." >&2
  exit 1
fi

if [ "$SKIP_BUILD" -eq 0 ]; then
  echo "==> Building"
  npm run build
else
  echo "==> Skipping build, using the existing www/"
fi

# A truncated or failed build is the one thing rsync would happily publish.
if [ ! -f www/index.html ]; then
  echo "ERROR: www/index.html is missing — the build did not produce a site." >&2
  exit 1
fi

FILES=$(find www -type f | wc -l | tr -d ' ')
if [ "$FILES" -lt 10 ]; then
  echo "ERROR: www/ has only $FILES files. That is not a complete build." >&2
  exit 1
fi

echo "==> Built $FILES files"
echo "==> Target: ${USER}@${HOST}:${TARGET}/ (port ${PORT})"

# No --delete, deliberately, and do not add it.
#
# Asset filenames are content-hashed, so yesterday's files are inert. But a
# browser tab still running the previous build asks for its own chunks by name.
# Deleting them turns a background deploy into a blank screen for anyone
# mid-session. Stale files cost disk; missing ones cost a climber their tick.
#
# There is also history here: a --delete against a server path once wiped a
# framework cache directory and took the API down.
RSYNC_OPTS=(-az --human-readable --itemize-changes)

if [ "$GO" -eq 0 ]; then
  echo
  echo "==> DRY RUN — nothing will be transferred."
  echo "    Lines below are what WOULD change. Re-run with --go to deploy."
  echo
  rsync "${RSYNC_OPTS[@]}" --dry-run \
    -e "ssh -p ${PORT}" \
    www/ "${USER}@${HOST}:${TARGET}/"
  echo
  echo "==> Dry run complete. Nothing was sent."
  exit 0
fi

echo
echo "==> Deploying for real"
rsync "${RSYNC_OPTS[@]}" \
  -e "ssh -p ${PORT}" \
  www/ "${USER}@${HOST}:${TARGET}/"

echo
echo "==> Done. Deployed $FILES files to ${HOST}:${TARGET}"
echo "    Service worker: returning visitors update on their next load, not instantly."
