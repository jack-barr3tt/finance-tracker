#!/bin/sh
set -eu

DEPLOY_PATH="${DEPLOY_PATH:?DEPLOY_PATH is required}"
IMAGE_TAG="${IMAGE_TAG:?IMAGE_TAG is required}"
REGISTRY="${REGISTRY:-ghcr.io/jack-barr3tt}"

export REGISTRY IMAGE_TAG

cd "$DEPLOY_PATH"
docker compose -f deploy/docker-compose.yml pull
docker compose -f deploy/docker-compose.yml up -d
