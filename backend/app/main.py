from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth_router, feedback_router, groups_router, matching_router, messages_router, notifications_router, sessions_router, users_router

settings = get_settings()

app = FastAPI(
    title="StudySync AI API",
    description="AI-powered study group matching platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"] if settings.app_env == "development" else ["https://studysync.ai"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth_router, prefix="/v1")
app.include_router(feedback_router, prefix="/v1")
app.include_router(groups_router, prefix="/v1")
app.include_router(messages_router, prefix="/v1")
app.include_router(sessions_router, prefix="/v1")
app.include_router(users_router, prefix="/v1")
app.include_router(notifications_router, prefix="/v1")
app.include_router(matching_router, prefix="/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/ready")
async def readiness_check():
    return {"status": "ready"}
