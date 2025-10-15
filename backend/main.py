from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import work_patterns, learning, health, insights, users, application_activity

# Load environment variables
load_dotenv()

# Create FastAPI instance
app = FastAPI(
    title="Employee360 API",
    description="API for tracking work patterns, learning progress, health metrics, and AI insights",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database events
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(application_activity.router, prefix="/api/apps", tags=["application-activity"])
app.include_router(work_patterns.router, prefix="/api/work-patterns", tags=["work-patterns"])
app.include_router(learning.router, prefix="/api/learning", tags=["learning"])
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(insights.router, prefix="/api/insights", tags=["insights"])

@app.get("/")
async def root():
    return {"message": "Employee360 API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.getenv("API_HOST", "127.0.0.1"),
        port=int(os.getenv("API_PORT", 8001)),
        reload=False,
        log_level="info"
    )