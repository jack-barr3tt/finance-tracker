#!/usr/bin/env bash
# Runs on Woodpecker after a merge to main.
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:?DEPLOY_PATH is required}"
WEB_ROOT="${DEPLOY_PATH}/frontend/dist"
SERVICE_NAME="${SERVICE_NAME:-finance-tracker}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

install -m 755 "${SCRIPT_DIR}/finance-tracker" "${DEPLOY_PATH}/finance-tracker"
mkdir -p "${WEB_ROOT}"
rsync -a --delete "${SCRIPT_DIR}/dist/" "${WEB_ROOT}/"

sudo systemctl restart "${SERVICE_NAME}"
