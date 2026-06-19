# GitHub Webhook Auto Deployment (Systemd-based)

This service listens for GitHub webhook events and automatically deploys a project locally using git + docker compose.

---

## Architecture

GitHub Push Event
  ↓
HTTP Webhook (Node.js / Express)
  ↓
Secret validation via query param (?secret=...)
  ↓
System script execution
  ↓
git restore + git pull
  ↓
docker compose up -d --build

---

## Requirements

- Node.js 20+
- systemd
- git installed on host
- docker + docker compose installed on host

---

## Installation

1. Clone this repo

```bash
git clone https://github.com/YOUR_USER/github-webhook-automatic-deployment.git
````

2. Install dependencies

```bash
npm install
````

3. Create .env file

```sh
SECRET_TOKEN=your_secret_here
PORT=4000
````

---

## Systemd service

Create:

```bash
sudo nano /etc/systemd/system/webhook-deployer.service
````

Example:

```bash
[Unit]
Description=GitHub Webhook Deployer
After=network.target

[Service]
ExecStart=/usr/bin/node /home/kikchan/Metalforce/github-webhook-automatic-deployment/server.js
WorkingDirectory=/home/kikchan/Metalforce/github-webhook-automatic-deployment
Restart=always
EnvironmentFile=/home/kikchan/Metalforce/github-webhook-automatic-deployment/.env
User=kikchan

[Install]
WantedBy=multi-user.target

Enable service:

sudo systemctl daemon-reload
sudo systemctl enable webhook-deployer
sudo systemctl restart webhook-deployer
````

---

## GitHub webhook configuration

Payload URL:
https://YOUR_DOMAIN/deploy?project=HouseRepository&secret=YOUR_SECRET

Content type:
application/json

Events:
Push events

---

## Deployment script

```bash
sudo nano /usr/local/bin/deploy-project.sh
````

```bash
chmod +x /usr/local/bin/deploy-project.sh
````

---

## deploy-project.sh

```bash
#!/bin/bash

set -euo pipefail

PROJECT="$1"
BASE="/home/kikchan/Metalforce"
PROJECT_DIR="$BASE/$PROJECT"

echo "======================================"
echo "[DEPLOY START] $PROJECT"
echo "Path: $PROJECT_DIR"
echo "======================================"

# Validate directory exists
if [ ! -d "$PROJECT_DIR" ]; then
  echo "[ERROR] Project directory not found: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR"

# Fix common git permission issues (ONLY .git, not whole repo)
if [ -d ".git" ]; then
  echo "[FIX] Ensuring git ownership is correct..."
  sudo chown -R kikchan:kikchan .git || {
    echo "[WARN] chown failed (maybe no sudo rights or already correct)"
  }
fi

echo "[GIT] Cleaning working directory..."
git restore .

echo "[GIT] Pulling latest changes..."
git pull

echo "[DOCKER] Building and starting containers..."
docker compose up -d --build

echo "======================================"
echo "[DEPLOY DONE] $PROJECT"
echo "======================================"
````

---

## Common issues

### Permission errors in .git
```bash
sudo chown -R $USER:$USER /home/kikchan/Metalforce/PROJECT/.git
````

---

## Notes

- Do NOT run this inside Docker unless you intentionally mount full host tooling
- SSH is not required for deployment
- systemd handles persistence
- GitHub webhook only triggers HTTP request