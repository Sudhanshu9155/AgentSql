# AgentSQL

An AI-powered database analytics platform with:
- ?? React frontend (`client/`)
- ?? Node.js/Express backend (`server/`)
- ?? Python FastAPI AI agent (`agent/`)
- ?? MongoDB Atlas (cloud database)

## Run Locally

### 1. Frontend
```bash
cd client
npm install
npm run dev
```
Runs at: `http://localhost:5173`

### 2. Backend (Server)
```bash
cd server
npm install
npm run dev
```
Runs at: `http://localhost:3001`

### 3. Agent Service
```bash
cd agent
pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```
Runs at: `http://localhost:8000`

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random secret for JWT signing |
| `ENCRYPTION_KEY` | 64-char hex key for field encryption |
| `GEMINI_API_KEY` | Google Gemini API key |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full step-by-step instructions to deploy on **AWS EC2 + GitHub Actions**.
