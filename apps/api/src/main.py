import sys
import os

# Add project root to path
sys.path.insert(0, r"C:\planet-life")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.business import router as business_router
from routes.finance import router as finance_router
from routes.real_estate import router as real_estate_router

app = FastAPI(title="Planet Life API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(business_router, prefix="/api/business", tags=["business"])
app.include_router(finance_router, prefix="/api/finance", tags=["finance"])
app.include_router(real_estate_router, prefix="/api/real-estate", tags=["real-estate"])

@app.get("/")
def health_check():
    return {"status": "healthy", "platform": "Planet Life"}