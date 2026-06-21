import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database import engine, Base
from backend.app.routers import products, customers, orders, auth

# Automatically create database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    description="A FastAPI backend for inventory control, customer logs, and order processing.",
    version="1.0.0"
)

# Enable CORS for frontend integration. 
# Credentials (cookies) require explicit origins instead of wildcard '*'.
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = allowed_origins_env.split(",") if allowed_origins_env else []

# Strip trailing slashes and whitespace in case they were added accidentally
ALLOWED_ORIGINS = [origin.strip().rstrip("/") for origin in ALLOWED_ORIGINS if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(orders.router, prefix="/api")


@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Inventory & Order Management System API is running."
    }
