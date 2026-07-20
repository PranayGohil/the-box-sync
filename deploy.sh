#!/bin/bash

# ==============================================================================
# Production-grade Monorepo Deployment Script
# Description: Automates deployment for MERN monorepo on Ubuntu VPS.
#              Intelligently detects changed directories, runs optimized npm install,
#              builds frontends, and restarts PM2 backend processes.
# ==============================================================================

# Exit immediately if any command fails, or if an undefined variable is used
set -euo pipefail

# ANSI color codes for logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flag for forcing full deployment
FORCE_DEPLOY=false

# Error handler trap
cleanup_on_error() {
  local exit_code=$?
  echo -e "\n${RED}======================================================================${NC}"
  echo -e "${RED}✘ DEPLOYMENT FAILED at line $BASH_LINENO: command '$BASH_COMMAND' failed with status $exit_code${NC}"
  echo -e "${RED}======================================================================${NC}"
  exit "$exit_code"
}
trap cleanup_on_error ERR

log_info() {
  echo -e "\n${BLUE}=================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}=================================${NC}"
}

log_success() {
  echo -e "${GREEN}✔ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

log_error() {
  echo -e "${RED}✘ $1${NC}" >&2
}

# Print usage
usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -f, --force    Force deployment/build of all applications in the repository"
  echo "  -h, --help     Show this help message"
  exit 0
}

# Parse command line options
while [[ $# -gt 0 ]]; do
  case "$1" in
    -f|--force)
      FORCE_DEPLOY=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      log_error "Unknown option: $1"
      usage
      ;;
  esac
done

# Detect the application directory for a given changed file path
# Traverses up directories until it finds a package.json
find_app_dir() {
  local file_path="$1"
  local dir
  dir=$(dirname "$file_path")
  
  # Ignore files directly in the root directory
  if [ "$dir" = "." ]; then
    echo ""
    return
  fi
  
  # Traverse up directories
  while [ "$dir" != "." ] && [ "$dir" != "/" ] && [ -n "$dir" ]; do
    if [ -f "$dir/package.json" ]; then
      echo "$dir"
      return
    fi
    dir=$(dirname "$dir")
  done
  
  echo ""
}

# Scan the workspace and return all valid apps (containing package.json)
find_all_apps() {
  local dirs=()
  # Find package.json files up to 3 levels deep, excluding node_modules and .git
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    local app_dir
    app_dir=$(dirname "$file" | sed 's|^\./||')
    if [ -n "$app_dir" ] && [ "$app_dir" != "." ]; then
      dirs+=("$app_dir")
    fi
  done < <(find . -maxdepth 3 -name package.json -not -path '*/node_modules/*' -not -path '*/.git/*')
  echo "${dirs[@]}"
}

# Heuristic check: is this app a React frontend?
is_frontend() {
  local dir="$1"
  if [ -f "$dir/package.json" ]; then
    # React apps in this monorepo define a "build" script in package.json
    if grep -q '"build":' "$dir/package.json"; then
      return 0
    fi
  fi
  return 1
}

# Heuristic check: is this app a Node.js backend server?
is_backend() {
  local dir="$1"
  if [ -f "$dir/package.json" ]; then
    # Backend servers in this monorepo do NOT have a "build" script
    if ! grep -q '"build":' "$dir/package.json"; then
      return 0
    fi
  fi
  return 1
}

# Map backend directories to PM2 process names matching your production config
get_pm2_process_name() {
  local dir="$1"
  case "$dir" in
    "server") echo "thebox-server" ;;
    "payroll-server") echo "payroll-server" ;;
    "shop/server") echo "shop-server" ;;
    *)
      # Fallback: replace slashes with hyphens
      echo "${dir//\//-}"
      ;;
  esac
}

# Restart PM2 process safely, start it if not running
restart_pm2_process() {
  local process_name="$1"
  local app_dir="$2"
  
  log_info "Restarting PM2 process: $process_name"
  
  if pm2 describe "$process_name" > /dev/null 2>&1; then
    pm2 restart "$process_name"
    log_success "Successfully restarted PM2 process: $process_name"
  else
    log_warning "PM2 process '$process_name' is not currently active. Starting it..."
    # Store current directory to return to it
    local current_dir
    current_dir=$(pwd)
    
    cd "$app_dir"
    # Backends run index.js as entrypoint.
    pm2 start index.js --name "$process_name"
    
    cd "$current_dir"
    log_success "Successfully started PM2 process: $process_name"
  fi
}

# Main execution flow
main() {
  local changed_apps=()
  local changed_files=""
  
  # Ensure we are inside a Git repository
  if [ ! -d ".git" ]; then
    log_error "Error: This script must be run at the root of a Git repository."
    exit 1
  fi

  # Get the current active branch on the VPS
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  log_success "Active branch detected on VPS: $CURRENT_BRANCH"

  if [ "$FORCE_DEPLOY" = true ]; then
    log_info "FORCE DEPLOYMENT REQUESTED. Rebuilding all apps..."
    read -r -a changed_apps <<< "$(find_all_apps)"
  else
    # Save the current commit hash before pulling new changes
    PREV_COMMIT=$(git rev-parse HEAD)
    
    log_info "Pulling latest code from origin/$CURRENT_BRANCH..."
    git fetch origin "$CURRENT_BRANCH"
    git reset --hard origin/"$CURRENT_BRANCH"
    
    # Save the new commit hash after pull
    NEW_COMMIT=$(git rev-parse HEAD)
    
    # If the commit hashes are the same, nothing new was pulled
    if [ "$PREV_COMMIT" = "$NEW_COMMIT" ]; then
      log_success "Code is already up to date. No commits pulled."
      # Check if any app lacks node_modules (needs first time setup)
      local apps_needing_setup=()
      read -r -a all_detected_apps <<< "$(find_all_apps)"
      for app in "${all_detected_apps[@]}"; do
        if [ ! -d "$app/node_modules" ]; then
          apps_needing_setup+=("$app")
        fi
      done
      
      if [ ${#apps_needing_setup[@]} -eq 0 ]; then
        log_success "No deployment needed. All node_modules present and code is up to date."
        log_info "To force rebuild, run: ./deploy.sh --force"
        exit 0
      else
        log_warning "The following apps are missing node_modules: ${apps_needing_setup[*]}"
        log_info "Triggering deployment for apps requiring initialization."
        changed_apps=("${apps_needing_setup[@]}")
      fi
    else
      # Get list of changed files between the previous commit and the new commit
      changed_files=$(git diff --name-only "$PREV_COMMIT" "$NEW_COMMIT")
      
      # Determine unique app directories affected by the changes
      while IFS= read -r file; do
        [ -z "$file" ] && continue
        local app_dir
        app_dir=$(find_app_dir "$file")
        if [ -n "$app_dir" ]; then
          # Add to array if not already present
          local exists=false
          for app in "${changed_apps[@]}"; do
            if [ "$app" = "$app_dir" ]; then
              exists=true
              break
            fi
          done
          if [ "$exists" = false ]; then
            changed_apps+=("$app_dir")
          fi
        fi
      done <<< "$changed_files"
    fi
  fi

  if [ ${#changed_apps[@]} -eq 0 ]; then
    log_success "No application code changes detected. Deployment complete."
    exit 0
  fi

  log_success "Detected changed applications: ${changed_apps[*]}"

  # Loop through each changed app and process them
  for app in "${changed_apps[@]}"; do
    if [ ! -d "$app" ]; then
      log_warning "Directory '$app' no longer exists. Skipping."
      continue
    fi

    # 1. Determine if npm install is required
    local needs_install=false
    if [ ! -d "$app/node_modules" ]; then
      needs_install=true
    elif [ "$FORCE_DEPLOY" = true ]; then
      needs_install=true
    else
      # If package.json or package-lock.json changed, trigger install
      while IFS= read -r file; do
        if [ "$file" = "$app/package.json" ] || [ "$file" = "$app/package-lock.json" ]; then
          needs_install=true
          break
        fi
      done <<< "$changed_files"
    fi

    # 2. Run npm install if needed
    if [ "$needs_install" = true ]; then
      log_info "Installing dependencies for: $app"
      cd "$app"
      # Using --legacy-peer-deps to prevent peer conflict errors in older panels
      npm install --legacy-peer-deps
      cd - > /dev/null
      log_success "Successfully installed dependencies for: $app"
    else
      log_info "Skipping npm install for $app (no package.json changes)"
    fi

    # 3. Build frontends or restart PM2 for backends
    if is_frontend "$app"; then
      log_info "Building frontend app: $app"
      cd "$app"
      npm run build
      cd - > /dev/null
      log_success "Successfully built frontend app: $app"
      
    elif is_backend "$app"; then
      local pm2_name
      pm2_name=$(get_pm2_process_name "$app")
      restart_pm2_process "$pm2_name" "$app"
      
    else
      log_warning "App '$app' has package.json but doesn't match frontend or backend profile. Skipping."
    fi
  done

  log_info "DEPLOYMENT COMPLETED SUCCESSFULLY!"
}

# Run the script
main
