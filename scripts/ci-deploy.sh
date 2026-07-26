#!/bin/sh
set -eu

: "${SSH_KEY:?missing secret: deploy_ssh_key}"
: "${DEPLOY_HOST:?missing secret: deploy_host}"
: "${DEPLOY_USER:?missing secret: deploy_user}"
: "${DEPLOY_PATH:?missing secret: deploy_path}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"

tar czf release.tar.gz deploy scripts/deploy.sh

mkdir -p ~/.ssh && chmod 700 ~/.ssh
printf '%s' "$SSH_KEY" > ~/.ssh/id_ed25519
chmod 600 ~/.ssh/id_ed25519
ssh-keyscan -H "$DEPLOY_HOST" >> ~/.ssh/known_hosts 2>/dev/null

ssh -i ~/.ssh/id_ed25519 -o BatchMode=yes "$DEPLOY_USER@$DEPLOY_HOST" \
  "mkdir -p '$DEPLOY_PATH/incoming'"

scp -i ~/.ssh/id_ed25519 -o BatchMode=yes release.tar.gz \
  "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/incoming/"

ssh -i ~/.ssh/id_ed25519 -o BatchMode=yes "$DEPLOY_USER@$DEPLOY_HOST" \
  "set -eu; cd '$DEPLOY_PATH'; tar xzf incoming/release.tar.gz; rm -f incoming/release.tar.gz; DEPLOY_PATH='$DEPLOY_PATH' IMAGE_TAG='$IMAGE_TAG' sh scripts/deploy.sh"

echo "==> Deploy complete"
