#!/usr/bin/env bash
# Stops everything start_all.sh started: the Angular dev server (:4200) and
# all backend containers (docker-compose). Safe to re-run.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> Stopping Angular frontend (port 4200)..."
PIDS="$(lsof -ti:4200 -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$PIDS" ]; then
  echo "$PIDS" | xargs kill 2>/dev/null || true
  sleep 1
  # Escalate to SIGKILL for anything still holding the port.
  REMAINING="$(lsof -ti:4200 -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$REMAINING" ]; then
    echo "$REMAINING" | xargs kill -9 2>/dev/null || true
  fi
  echo "    Frontend stopped."
else
  echo "    Frontend was not running."
fi

echo "==> Stopping backend containers..."
docker compose down

echo "==> Done."
