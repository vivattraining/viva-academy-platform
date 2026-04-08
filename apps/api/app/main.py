from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import Base, engine
from app import models  # noqa: F401
from app.routers import academy, health

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Academy OS API",
    version="0.1.0",
    description="Standalone backend for VIVA and future white-label academy tenants."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(academy.router, prefix="/api/v1/academy", tags=["academy"])


@app.get("/")
def read_root():
    return {
        "message": "Academy OS API is live"
    }
