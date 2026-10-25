#!/usr/bin/env bash
# deploy.sh
# Validate and start a local production build without changing any hosted site.
set -euo pipefail
cd "$(dirname "$0")"
npm ci
npm test
npm run build
exec npm start
