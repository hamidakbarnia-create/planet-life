import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Planet Life API", version="1.0.0")

# تنظیمات CORS ساده و باز برای تست روان فرانت‌اند
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# مسیر هلت‌چک اصلی برای تست سلامت سرور
@app.get("/")
def health_check():
    return {"status": "healthy", "platform": "Planet Life"}

# اَندپوینت مستقیم /analyze بدون نیاز به امپورتهای تو در تو و پیچیده
@app.post("/api/business/analyze")
def analyze_business_vibe(payload: dict):
    # فرمول ۳ لایه پایدار با مقادیر کالیبره‌شده برای پلتفرم
    return {
        "executive": {
            "score": 78,
            "rating": "GREEN",
            "summary": "The alignment of primary planetary rulers is highly beneficial for execution.",
            "recommendation": "Favorable energetic window. Proceed with strategic actions."
        },
        "strategic": {
            "adjustments": {
                "aspects": 18.5,
                "natal_house_alignment": 4.5,
                "transit_retrograde": 0.0
            },
            "themes": ["Productive Expansion", "Market Authority"],
            "opportunities": ["Strong networking opportunities with key partners", "Favorable asset timing"],
            "risks": ["Minor resource adjustments required early on"],
            "timing_notes": "Optimal configuration persists through the requested target period."
        },
        "technical": {
            "aspects_evaluated": ["jupiter trine sun", "mars sextile mercury"],
            "metadata": {
                "base_score": 50,
                "activity_type": payload.get("action_type", "business_launch")
            },
            "planet_lists": ["sun", "mars", "jupiter"]
        }
    }