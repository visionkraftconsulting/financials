#!/bin/bash

# === CONFIG ===
APP_DIR="/home/bitnami/scripts/financial/investment-tracker"
FRONTEND_DIR="$APP_DIR/frontend"
BUILD_OUTPUT_DIR="/var/www/investment-tracker-frontend"
PM2_APP_NAME="sgaInvest"
GIT_BRANCH="main"
COMMIT_MSG=${1:-"Update from deploy script"}
SSH_KEY="$HOME/.ssh/id_ed25519"
SSH_PASSPHRASE="!@P@ssys6461@#"
LOG_FILE="$HOME/deploy-msm.log"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
RETENTION_COUNT=5

# === LOGGING ===
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# === CLEANUP ON EXIT ===
cleanup() {
    if [ -n "$SSH_AGENT_PID" ]; then
        kill "$SSH_AGENT_PID" > /dev/null 2>&1
        log "🧹 Cleaned up ssh-agent"
    fi
}
trap cleanup EXIT

# === USER CHOICE (Validated Loop) ===
while true; do
    echo "Please select an option:"
    echo "1) Local-only deployment (build frontend and restart PM2 app)"
    echo "2) Local deployment + retention policy (clean old builds)"
    echo "3) Delete current deployed build only"
    echo "4) Push local changes to Git"
    echo "5) Pull latest changes from Git"
    echo "6) Delete current build then deploy new one (Option 3 + 1)"
    echo "7) Push newly added (untracked) files to Git"
    read -p "Enter your choice (1–7): " choice

    if [[ "$choice" =~ ^[1-7]$ ]]; then
        log "You selected option $choice. Press Enter to continue..."
        read -r
        break
    else
        echo "❌ Invalid selection. Please enter a number between 1 and 7."
    fi
done


# === START ===
log "🔄 Starting deployment at $TIMESTAMP"
cd "$APP_DIR" || { log "❌ Failed to access $APP_DIR"; exit 1; }

# === SSH AGENT SETUP ===
log "🔐 Starting ssh-agent..."
eval "$(ssh-agent -s)" || { log "❌ ssh-agent failed"; exit 1; }

log "🔑 Adding SSH key to agent..."
expect <<EOF
log_user 0
spawn ssh-add $SSH_KEY
expect {
    "Enter passphrase for $SSH_KEY:" {
        send "$SSH_PASSPHRASE\r"
        exp_continue
    }
    eof
}
EOF

if [ $? -ne 0 ]; then
    log "❌ Failed to add SSH key"
    exit 1
fi

# === LOCAL DEPLOY FUNCTION ===
deploy_local() {
    log "🌐 Building frontend..."
    rm -rf "$FRONTEND_DIR/build"
    cd "$FRONTEND_DIR" || { log "❌ Frontend directory not found!"; return 1; }

    yarn build || { log "❌ Frontend build failed"; return 1; }

    DEPLOYED_PATH="$BUILD_OUTPUT_DIR/build-$TIMESTAMP"
    log "📁 Preparing build for deployment at $DEPLOYED_PATH"
    sudo mkdir -p "$DEPLOYED_PATH" || { log "❌ Failed to create deployment directory"; return 1; }
    sudo mv build/* "$DEPLOYED_PATH" || { log "❌ Failed to move build files"; return 1; }
    rm -rf build

    sudo ln -sfn "$DEPLOYED_PATH" "$BUILD_OUTPUT_DIR/current" || { log "❌ Failed to update symlink"; return 1; }
    sudo chown -R bitnami:bitnami "$BUILD_OUTPUT_DIR" || { log "❌ Failed to set ownership"; return 1; }
    sudo chmod -R 755 "$BUILD_OUTPUT_DIR"

    log "✅ Frontend deployed at $DEPLOYED_PATH"

    log "🔁 Restarting PM2 app: $PM2_APP_NAME"
    command -v pm2 >/dev/null 2>&1 && pm2 restart "$PM2_APP_NAME" || { log "❌ PM2 restart failed"; return 1; }

    log "✅ Local-only deployment completed successfully!"
}

# === DEPLOY WITH RETENTION FUNCTION ===
deploy_with_retention() {
    CURRENT_LINK=$(readlink "$BUILD_OUTPUT_DIR/current")
    if [ -n "$CURRENT_LINK" ]; then
        log "🗑️ Removing current build directory: $CURRENT_LINK"
        sudo rm -rf "$CURRENT_LINK" || { log "⚠️ Failed to remove current build"; return 1; }
    fi

    deploy_local || return 1

    log "🧹 Cleaning up old builds (keep last $RETENTION_COUNT)"
    sudo find "$BUILD_OUTPUT_DIR" -maxdepth 1 -type d -name "build-*" | \
        sort -r | \
        sed -e "1,${RETENTION_COUNT}d" | \
        xargs -r sudo rm -rf

    log "✅ Retention cleanup complete!"
}

# === DELETE CURRENT ONLY FUNCTION ===
delete_current_build_only() {
    CURRENT_LINK="$BUILD_OUTPUT_DIR/current"
    if [ -L "$CURRENT_LINK" ]; then
        TARGET=$(readlink "$CURRENT_LINK")
        log "🗑️ Removing current symlink: $CURRENT_LINK -> $TARGET"
        sudo rm "$CURRENT_LINK" || { log "❌ Failed to remove symlink"; return 1; }
        if [ -d "$TARGET" ]; then
            sudo rm -rf "$TARGET" || { log "❌ Failed to remove target directory"; return 1; }
        fi
        log "✅ Current build deleted."
    else
        log "⚠️ No current build to delete."
    fi
}

# === DELETE THEN REDEPLOY FUNCTION ===
delete_and_redeploy() {
    delete_current_build_only || return 1
    deploy_local || return 1
}

# === OPTION HANDLER ===
case "$choice" in
  1)
    deploy_local || exit 1
    ;;
  2)
    deploy_with_retention || exit 1
    ;;
  3)
    delete_current_build_only || exit 1
    ;;
  4)
    log "📦 Staging and pushing changes to Git..."
    git add .
    git commit -m "$COMMIT_MSG" || log "ℹ️ No changes to commit"
    git push -u origin "$GIT_BRANCH" || { log "❌ Git push failed"; exit 1; }
    log "✅ Git push completed successfully!"
    ;;
  5)
    log "🔄 Fetching latest changes from Git..."
    git fetch origin "$GIT_BRANCH" || { log "❌ Git fetch failed"; exit 1; }
    git reset --hard origin/"$GIT_BRANCH" || { log "❌ Git reset failed"; exit 1; }
    log "✅ Latest Git changes pulled!"
    ;;
  6)
    delete_and_redeploy || exit 1
    ;;
  7)
    log "📥 Adding untracked files to Git..."
    git add -A
    git commit -m "Auto commit: newly added files" || log "ℹ️ No new files to commit"
    git push -u origin "$GIT_BRANCH" || { log "❌ Git push failed"; exit 1; }
    log "✅ Newly added files pushed!"
    ;;
  *)
    log "❌ Invalid option. Exiting..."
    exit 1
    ;;
esac

exit 0
