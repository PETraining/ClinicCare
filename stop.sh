#!/usr/bin/env bash
# Stops everything start_all.sh started: all backend and frontend containers
# (docker-compose). Safe to re-run.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> Stopping containers..."
docker compose down

echo "==> Done."
