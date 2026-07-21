#!/bin/sh
# Runs in Woodpecker. Uploads release.tar.gz and invokes deploy.sh on the server.
set -eu

: "${SSH_KEY:?missing secret: deploy_ssh_key}"
: "${DEPLOY_HOST:?missing secret: deploy_host}"
: "${DEPLOY_USER:?missing secret: deploy_user}"
: "${DEPLOY_PATH:?missing secret: deploy_path}"

if [ ! -f release.tar.gz ]; then
  echo "release.tar.gz not found — run the package step first"
  exit 1
fi

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
printf '%s' "$SSH_KEY" > "$HOME/.ssh/id_ed25519"
chmod 600 "$HOME/.ssh/id_ed25519"
ssh-keygen -lf "$HOME/.ssh/id_ed25519" >/dev/null

SSH="ssh -i $HOME/.ssh/id_ed25519 -o IdentitiesOnly=yes -o BatchMode=yes"
SCP="scp -i $HOME/.ssh/id_ed25519 -o IdentitiesOnly=yes -o BatchMode=yes"

ssh-keyscan -H "$DEPLOY_HOST" >> "$HOME/.ssh/known_hosts" 2>/dev/null

echo "==> SSH preflight"
$SSH "$DEPLOY_USER@$DEPLOY_HOST" "whoami"
$SSH "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p '$DEPLOY_PATH/incoming'"
$SSH "$DEPLOY_USER@$DEPLOY_HOST" "touch '$DEPLOY_PATH/incoming/.woodpecker-write-test' && rm '$DEPLOY_PATH/incoming/.woodpecker-write-test'"
$SSH "$DEPLOY_USER@$DEPLOY_HOST" "sudo -n -l" | grep -q 'systemctl restart finance-tracker' || {
  echo "sudo preflight failed: jack-barrett-money needs passwordless systemctl restart finance-tracker"
  exit 1
}

echo "==> Upload release"
$SCP release.tar.gz "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/incoming/"

echo "==> Install on server"
$SSH "$DEPLOY_USER@$DEPLOY_HOST" "set -eu && cd '$DEPLOY_PATH/incoming' && tar -xzf release.tar.gz && DEPLOY_PATH='$DEPLOY_PATH' ./deploy.sh && rm -f release.tar.gz"

echo "==> Deploy complete"
