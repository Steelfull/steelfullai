#!/usr/bin/env bash
# Daily lead refresh: collect -> enrich emails -> push to /insights/leads.
# Reads keys from the repo-root .env (see leadgen/.env.example).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[leadgen] $(date -Is) starting refresh"
node leadgen/cli.js source
node leadgen/cli.js enrich
node leadgen/cli.js push
echo "[leadgen] $(date -Is) refresh done"
