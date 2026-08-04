# ?? AgentSQL — Deployment Guide (EC2 + GitHub Actions)

> **Stack**: React (Vite) · Node.js/Express · Python FastAPI · MongoDB Atlas
> **Services**: `client` served by Nginx :80 · `server` :3001 · `agent` :8000
> **No Docker. No ECR. Just EC2 + Git + PM2.**

---

# PART 1 — GITHUB SETUP

---

## Step 1 — Push Your Code to GitHub

If your code is not yet on GitHub:

```powershell
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/agentsql.git
git push -u origin main
```

> Make sure `.env` is in `.gitignore` — never push real secrets to GitHub.

---

## Step 2 — Add GitHub Secrets

Go to your repo on GitHub:
**Settings ? Secrets and variables ? Actions ? New repository secret**

Add these 6 secrets:

| Secret Name       | Value                                           |
|-------------------|--------------------------------------------------|
| `EC2_HOST`        | Your EC2 public IP address (e.g. `13.233.x.x`) |
| `EC2_SSH_KEY`     | Full contents of your `.pem` key file           |
| `MONGO_URI`       | Your MongoDB Atlas connection string            |
| `JWT_SECRET`      | A long random string (64+ chars)                |
| `ENCRYPTION_KEY`  | Exactly 64 hex characters (32 bytes)            |
| `GEMINI_API_KEY`  | Your Google Gemini API key                      |

**How to generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**How to generate ENCRYPTION_KEY:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 3 — Understand the CI/CD Workflow

The file `.github/workflows/deploy.yml` is already in your project.

Every time you push to `main`, GitHub Actions will automatically:

```
git push ? GitHub Actions starts
    +-- SSH into your EC2 server
            +-- git pull (latest code)
            +-- npm ci  (server dependencies)
            +-- pip install -r requirements.txt
            +-- npm run build (React ? static files)
            +-- Copy built files ? /var/www/agentsql/
            +-- pm2 reload (restart server + agent)
```

You can also trigger it manually:
**GitHub ? Actions tab ? "Deploy AgentSQL to EC2" ? Run workflow**

---

# PART 2 — AWS EC2 SETUP

> Run these steps **once** to set up your server.

---

## Step 4 — Launch an EC2 Instance

1. Go to **AWS Console ? EC2 ? Launch Instance**
2. Configure:
   - **Name**: `agentsql-prod`
   - **AMI**: `Ubuntu Server 24.04 LTS`
   - **Instance type**: `t3.medium` (2 vCPU, 4 GB RAM) — minimum recommended
   - **Key pair**: Create new ? download `.pem` ? store safely
   - **Storage**: 20 GB gp3

3. Add **Inbound Security Group Rules**:

   | Port | Source      | Purpose              |
   |------|-------------|----------------------|
   | 22   | Your IP     | SSH access           |
   | 80   | 0.0.0.0/0   | React frontend       |
   | 3001 | 0.0.0.0/0   | Node.js API          |
   | 8000 | 127.0.0.1   | Python Agent (internal only) |

   > The agent runs on localhost only — Nginx proxies `/api/agent` to it.

---

## Step 5 — SSH Into Your EC2 Instance

```powershell
# On Windows (PowerShell) — fix key permissions first
icacls "your-key.pem" /inheritance:r /grant:r "%USERNAME%:R"

# Connect
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

---

## Step 6 — Install Required Software on EC2

Run all of these **once** after first SSH login:

### Install Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # should print v20.x.x
npm --version
```

### Install Python 3.11 + pip
```bash
sudo apt-get update
sudo apt-get install -y python3.11 python3-pip python3.11-venv
python3 --version   # should print 3.11.x
```

### Install PM2 (process manager)
```bash
sudo npm install -g pm2
pm2 --version
```

### Install Nginx (web server for React)
```bash
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
nginx -v
```

### Install Git
```bash
sudo apt-get install -y git
git --version
```

---

## Step 7 — Clone Your Repository on EC2

```bash
cd ~
git clone https://github.com/<your-username>/agentsql.git agentsql
cd agentsql
```

> If your repo is private, use a **GitHub Personal Access Token (PAT)**:
> ```bash
> git clone https://<your-token>@github.com/<your-username>/agentsql.git agentsql
> ```

---

## Step 8 — Create Production .env on EC2

```bash
cd ~/agentsql
nano .env
```

Paste your production values:
```env
PORT=3001
AGENT_URL=http://127.0.0.1:8000
JWT_SECRET=<your-long-random-string>
JWT_EXPIRES_IN=8h
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/agentsql?retryWrites=true&w=majority
ENCRYPTION_KEY=<your-64-char-hex-key>
GEMINI_API_KEY=<your-gemini-api-key>
```

Save: `Ctrl+O` ? `Enter` ? `Ctrl+X`

> This `.env` is the initial one. After first deploy, GitHub Actions will overwrite it automatically from your GitHub Secrets.

---

## Step 9 — Install Dependencies

```bash
# Server dependencies
cd ~/agentsql/server
npm ci --omit=dev

# Agent dependencies
cd ~/agentsql/agent
pip install -r requirements.txt

# Client dependencies + build
cd ~/agentsql/client
npm ci
npm run build
```

---

## Step 10 — Configure Nginx

Create the Nginx site config:
```bash
sudo nano /etc/nginx/sites-available/agentsql
```

Paste this config:
```nginx
server {
    listen 80;
    server_name _;

    root /var/www/agentsql;
    index index.html;

    # Serve React app (SPA fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to Node.js server
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Save: `Ctrl+O` ? `Enter` ? `Ctrl+X`

Enable the site and deploy client build:
```bash
# Create web root directory
sudo mkdir -p /var/www/agentsql

# Copy built React files
sudo cp -r ~/agentsql/client/dist/* /var/www/agentsql/

# Enable site
sudo ln -s /etc/nginx/sites-available/agentsql /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test config and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 11 — Start Services with PM2

```bash
cd ~/agentsql

# Start all services using the ecosystem config
pm2 start ecosystem.config.js

# Check they are all running
pm2 status

# Save PM2 process list (survives reboots)
pm2 save

# Auto-start PM2 on system reboot
pm2 startup
# ? Copy and run the command it prints (starts with: sudo env PATH=...)
```

Expected output from `pm2 status`:
```
+----------------------------------------------------+
¦ name                ¦ id ¦ status  ¦ cpu  ¦ memory ¦
+---------------------+----+---------+------+--------¦
¦ agentsql-server     ¦ 0  ¦ online  ¦ 0%   ¦ 60mb   ¦
¦ agentsql-agent      ¦ 1  ¦ online  ¦ 0%   ¦ 80mb   ¦
+----------------------------------------------------+
```

---

## Step 12 — Verify Everything Works

```bash
# Health check — API
curl http://localhost:3001/api/health
# Expected: {"status":"ok","timestamp":"..."}

# Agent health
curl http://localhost:8000/docs
# Expected: FastAPI Swagger UI HTML

# Frontend (via Nginx)
curl http://localhost/
# Expected: HTML of your React app
```

From your browser:
- **Frontend**: `http://<EC2-PUBLIC-IP>/`
- **API health**: `http://<EC2-PUBLIC-IP>/api/health`
- **Agent docs**: `http://<EC2-PUBLIC-IP>:8000/docs`

> ?? Port 8000 must be open in your EC2 security group to access agent docs from browser.

---

# PART 3 — AUTOMATED DEPLOYS

---

## Step 13 — Trigger Your First Automated Deploy

After completing Parts 1 and 2, push any change:

```powershell
git add .
git commit -m "deploy: production setup complete"
git push origin main
```

Watch the pipeline at:
`https://github.com/<your-username>/agentsql/actions`

Each deploy will:
1. SSH into EC2
2. Pull latest code
3. Install/update dependencies
4. Build React app
5. Reload PM2 (zero downtime)

---

## Step 14 — Useful Commands on EC2

```bash
# Check service status
pm2 status

# View live logs
pm2 logs agentsql-server
pm2 logs agentsql-agent

# Restart a specific service
pm2 restart agentsql-server
pm2 restart agentsql-agent

# Reload all (zero-downtime)
pm2 reload ecosystem.config.js

# Stop all services
pm2 stop all

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t               # test config
sudo systemctl reload nginx # apply config changes
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Service not starting | `pm2 logs agentsql-server` or `pm2 logs agentsql-agent` |
| MongoDB not connecting | Check `MONGO_URI` in `.env`, verify Atlas IP whitelist |
| Frontend shows blank page | Check `/var/www/agentsql/` has files, check Nginx: `sudo nginx -t` |
| GitHub Actions SSH fails | Verify `EC2_SSH_KEY` in GitHub Secrets has full `.pem` content |
| Port 3001 not responding | `pm2 status` — check server is `online`, check security group |
| Python agent crashes | `pm2 logs agentsql-agent`, check `GEMINI_API_KEY` is set |
| `pm2 reload` fails | Run `pm2 start ecosystem.config.js` first, then future deploys use `reload` |

---

## ? Full Checklist

**GitHub**
- [ ] Code pushed to `main` branch
- [ ] All 6 GitHub Secrets added (`EC2_HOST`, `EC2_SSH_KEY`, `MONGO_URI`, `JWT_SECRET`, `ENCRYPTION_KEY`, `GEMINI_API_KEY`)
- [ ] `.github/workflows/deploy.yml` present in repo
- [ ] `ecosystem.config.js` present in repo root

**EC2 Server (one-time setup)**
- [ ] EC2 instance running (Ubuntu 24.04, t3.medium)
- [ ] Security group: ports 22, 80, 3001 open
- [ ] Node.js 20 installed
- [ ] Python 3.11 + pip installed
- [ ] PM2 installed globally
- [ ] Nginx installed and running
- [ ] Repo cloned to `~/agentsql`
- [ ] `.env` created with real production values
- [ ] All dependencies installed
- [ ] Nginx configured and pointing to `/var/www/agentsql`
- [ ] React build copied to `/var/www/agentsql`
- [ ] PM2 started with `ecosystem.config.js`
- [ ] `pm2 save` and `pm2 startup` run
- [ ] Frontend loads at `http://<EC2-IP>/`
- [ ] API responds at `http://<EC2-IP>/api/health`

**After first GitHub Actions deploy**
- [ ] Push to main triggers the workflow successfully
- [ ] `pm2 status` shows both services `online`
- [ ] App works end-to-end ?

---

*AgentSQL — AI Database Analytics Platform*
