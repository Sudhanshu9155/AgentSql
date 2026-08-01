# 🚀 AgentSQL — Deployment Guide

> **Stack**: React (Vite) · Node.js/Express · Python FastAPI · MongoDB  
> **Services**: `client` :80 · `server` :3001 · `agent` :8000 · `mongo` :27017

---

# PART 1 — DOCKER

> Run all commands on your **local Windows machine** (PowerShell).

---

## Step 1 — Install Docker Desktop

Download and install from: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

After install, open Docker Desktop and make sure it says **"Engine running"**.

Verify in PowerShell:
```powershell
docker --version
docker compose version
```

---

## Step 2 — Understand the Project Files

These files are already created in your project:

| File | What It Does |
|------|-------------|
| `client/Dockerfile` | Builds React app → serves with Nginx |
| `client/nginx.conf` | Nginx config with SPA fallback + API proxy |
| `server/Dockerfile` | Runs Node.js/Express |
| `agent/Dockerfile` | Runs Python FastAPI |
| `docker-compose.yml` | Orchestrates all 4 services together |
| `client/.dockerignore` | Excludes node_modules, dist, .env |
| `server/.dockerignore` | Excludes node_modules, .env |
| `agent/.dockerignore` | Excludes __pycache__, .pyc, .env |

---

## Step 3 — Test Locally with Docker Compose

Before deploying, confirm everything works on your machine:

```powershell
# From your project root
docker compose build
docker compose up -d

# Check all containers are running
docker compose ps
```

Open in browser:
- Frontend → `http://localhost`
- API → `http://localhost:3001/api/health`
- Agent Docs → `http://localhost:8000/docs`

Stop when done:
```powershell
docker compose down
```

---

## Step 4 — Build Production Images Locally

```powershell
docker build -t agentsql-client:latest ./client
docker build -t agentsql-server:latest ./server
docker build -t agentsql-agent:latest  ./agent
```

If all 3 build without errors, your Docker setup is ready. ✅

---

# PART 2 — GITHUB

> Set up your code repository and CI/CD pipeline.

---

## Step 5 — Push Your Code to GitHub

If not already on GitHub:

```powershell
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/agentsql.git
git push -u origin main
```

> Make sure `.env` is in `.gitignore` — **never push real secrets**.

---

## Step 6 — Add GitHub Secrets

Go to your repo on GitHub:  
**Settings → Secrets and variables → Actions → New repository secret**

Add these 5 secrets:

| Secret Name | Value | Where to Get It |
|-------------|-------|----------------|
| `AWS_ACCESS_KEY_ID` | IAM access key | AWS Console → IAM → Users → Security Credentials |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key | Same page (shown once at creation) |
| `AWS_ACCOUNT_ID` | 12-digit number | Run: `aws sts get-caller-identity --query Account` |
| `EC2_HOST` | EC2 public IPv4 | EC2 Console → Instance → Public IPv4 address |
| `EC2_SSH_KEY` | Full `.pem` content | Open `.pem` in Notepad → copy everything |

---

## Step 7 — Understand the CI/CD Workflow

The file `.github/workflows/deploy.yml` is already in your project.

Every time you push to `main`, it automatically:

```
git push → GitHub Actions starts
    │
    ├── Builds client image  → pushes to AWS ECR
    ├── Builds server image  → pushes to AWS ECR
    └── Builds agent image   → pushes to AWS ECR
            │
            └── SSHs into EC2
                    └── pulls new images → restarts containers
```

To manually trigger it anytime:  
**GitHub → Actions tab → "Build, Push & Deploy AgentSQL" → Run workflow**

---

## Step 8 — Trigger Your First Automated Deploy

After AWS is set up (Part 3), just push any change:

```powershell
git add .
git commit -m "deploy: production setup"
git push origin main
```

Watch the pipeline at: `https://github.com/<your-username>/agentsql/actions`

---

# PART 3 — AWS

> Set up cloud infrastructure. Run AWS CLI commands in PowerShell.

---

## Step 9 — Install and Configure AWS CLI

Install:
```powershell
winget install Amazon.AWSCLI
```

Configure:
```powershell
aws configure
```

Enter when prompted:
- **Access Key ID** → your key
- **Secret Access Key** → your secret
- **Default region** → `ap-south-1`
- **Output format** → `json`

---

## Step 10 — Create ECR Repositories (Run Once)

ECR is AWS's private Docker image registry.

```powershell
aws ecr create-repository --repository-name agentsql-client --region ap-south-1
aws ecr create-repository --repository-name agentsql-server --region ap-south-1
aws ecr create-repository --repository-name agentsql-agent  --region ap-south-1
```

Get your Account ID (save this — used everywhere):
```powershell
aws sts get-caller-identity --query Account --output text
```

---

## Step 11 — Launch an EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Configure:
   - **Name**: `agentsql-prod`
   - **AMI**: `Ubuntu Server 24.04 LTS`
   - **Instance type**: `t3.medium` (2 vCPU, 4 GB RAM)
   - **Key pair**: Create new → download `.pem` → store safely
   - **Storage**: 20 GB gp3

3. Add **Inbound Security Group Rules**:

   | Port | Source | Purpose |
   |------|--------|---------|
   | 22 | Your IP only | SSH access |
   | 80 | 0.0.0.0/0 | React frontend |
   | 3001 | 0.0.0.0/0 | Node.js API |
   | 8000 | 0.0.0.0/0 | Python Agent |

---

## Step 12 — Install Docker on EC2

SSH into your EC2:
```powershell
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

Run on EC2:
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl awscli
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker ubuntu
newgrp docker
```

Verify:
```bash
docker --version
docker compose version
```

---

## Step 13 — Attach IAM Role to EC2

This lets EC2 pull images from ECR without storing AWS keys on the server.

1. **AWS Console → IAM → Roles → Create Role**
2. Trusted entity: **EC2**
3. Attach policy: `AmazonEC2ContainerRegistryReadOnly`
4. Name: `ec2-ecr-read-role` → Create
5. **EC2 → Your Instance → Actions → Security → Modify IAM Role**
6. Select `ec2-ecr-read-role` → Update

---

## Step 14 — Create Production `.env` on EC2

On EC2:
```bash
mkdir -p ~/agentsql && cd ~/agentsql
nano .env
```

Paste your real values:
```env
PORT=3001
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRES_IN=8h
MONGO_URI=mongodb://mongo:27017/agentsql
AGENT_URL=http://agent:8000
GEMINI_API_KEY=<your_gemini_api_key>
AWS_ACCOUNT_ID=<your_12_digit_id>
AWS_REGION=ap-south-1
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

---

## Step 15 — First Manual Deploy (Bootstrap)

Do this **once** to get images into ECR for the first time.

On your **local machine** (PowerShell):
```powershell
$ACCOUNT_ID = "123456789012"   # ← replace with yours
$REGION     = "ap-south-1"
$ECR        = "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR

# Build and push
docker build -t $ECR/agentsql-client:latest ./client; docker push $ECR/agentsql-client:latest
docker build -t $ECR/agentsql-server:latest ./server; docker push $ECR/agentsql-server:latest
docker build -t $ECR/agentsql-agent:latest  ./agent;  docker push $ECR/agentsql-agent:latest
```

Copy `docker-compose.yml` to EC2:
```powershell
scp -i "your-key.pem" "docker-compose.yml" ubuntu@<EC2-IP>:~/agentsql/
```

Start containers on EC2:
```bash
# On EC2
cd ~/agentsql
docker compose --env-file .env up -d

# Verify
docker compose ps
```

---

## Step 16 — Verify the Deployment

```bash
# Run from anywhere
curl http://<EC2-IP>/                      # Frontend
curl http://<EC2-IP>:3001/api/health       # API
# Open in browser: http://<EC2-IP>:8000/docs   # Agent
```

All returning responses = **deployment successful** ✅

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Container won't start | `docker compose logs <service-name>` |
| ECR login fails on EC2 | Re-run: `aws ecr get-login-password --region ap-south-1 \| docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com` |
| MongoDB not connecting | `docker compose ps mongo` then `docker compose logs mongo` |
| GitHub Actions SSH fails | Verify `EC2_SSH_KEY` has full `.pem` content including header/footer |
| Out of disk on EC2 | `docker system prune -a --volumes` |

---

## ✅ Full Checklist

**Docker**
- [ ] Docker Desktop installed and running
- [ ] All 3 images build successfully locally
- [ ] `docker compose up` works on local machine

**GitHub**
- [ ] Code pushed to `main` branch
- [ ] All 5 GitHub Secrets added
- [ ] `.github/workflows/deploy.yml` present in repo

**AWS**
- [ ] AWS CLI configured locally
- [ ] 3 ECR repositories created
- [ ] EC2 instance running with correct security group rules
- [ ] Docker installed on EC2
- [ ] IAM role attached to EC2
- [ ] Production `.env` created on EC2 (`~/agentsql/.env`)
- [ ] First manual build + push done from local machine
- [ ] `docker compose up -d` running on EC2
- [ ] Frontend loads at `http://<EC2-IP>/`
- [ ] GitHub Actions pipeline succeeds on next push ✓

---

*AgentSQL — AI Database Analytics Platform*
