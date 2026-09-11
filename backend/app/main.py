from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, credentials, password_generator, users, categories, clients, sharing, dashboard, logs
from app.core.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="Password Manager API",
    description="Secure Company & Client Password Manager",
    version="1.0.0",
    lifespan=lifespan,
)

import os

# Configure CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://.*\.vercel\.app|http://localhost:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(clients.router)
app.include_router(categories.router)
app.include_router(credentials.router)
app.include_router(sharing.router)
app.include_router(password_generator.router)
app.include_router(dashboard.router)
app.include_router(logs.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
