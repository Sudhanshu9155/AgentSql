# AgentSQL

A starter full-stack project with:
- React frontend in client/
- Express backend in server/
- Python AI service in agent/

## Run locally

### Frontend
```bash
cd client
npm install
npm run dev
```

### Backend
```bash
cd server
npm install
npm run dev
```

### Agent service
```bash
cd agent
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

### Docker
```bash
docker compose up --build
```
