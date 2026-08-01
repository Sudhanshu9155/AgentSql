from fastapi import FastAPI
from api.routes import router

app = FastAPI(title="AgentSQL Agent")
app.include_router(router)
