from bson import ObjectId
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_collection
import logging

router = APIRouter()

@router.get("/sleep", response_model=dict)
async def get_sleep_data(
    days: int = 7
):
    """Get sleep data analysis"""
    try:
        sleep_collection = get_collection("health_sleep")
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "user_id": ObjectId("68dd3c18a48c28b2bb1aa6b2"),
                    "date": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avg_duration": {"$avg": "$duration_hours"},
                    "avg_quality": {"$avg": "$quality_score"},
                    "total_nights": {"$sum": 1}
                }
            }
        ]
        
        result = await sleep_collection.aggregate(pipeline).to_list(length=1)
        
        if result:
            stats = result[0]
            return {
                "average_sleep_duration": round(stats["avg_duration"], 1),
                "average_sleep_quality": round(stats["avg_quality"], 1),
                "nights_tracked": stats["total_nights"],
                "sleep_debt": max(0, (8.0 * days) - (stats["avg_duration"] * stats["total_nights"]))
            }
        else:
            return {
                "average_sleep_duration": 0,
                "average_sleep_quality": 0,
                "nights_tracked": 0,
                "sleep_debt": 0
            }
    
    except Exception as e:
        logging.error(f"Error fetching sleep data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/activity", response_model=dict)
async def get_activity_data(
    days: int = 7
):
    """Get physical activity data"""
    try:
        activity_collection = get_collection("health_activity")
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "user_id": ObjectId("68dd3c18a48c28b2bb1aa6b2"),
                    "date": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avg_steps": {"$avg": "$steps"},
                    "total_workouts": {"$sum": "$workout_count"},
                    "avg_workout_duration": {"$avg": "$workout_duration_minutes"},
                    "total_days": {"$sum": 1}
                }
            }
        ]
        
        result = await activity_collection.aggregate(pipeline).to_list(length=1)
        
        if result:
            stats = result[0]
            return {
                "average_daily_steps": int(stats["avg_steps"]) if stats["avg_steps"] else 0,
                "total_workouts": int(stats["total_workouts"]) if stats["total_workouts"] else 0,
                "average_workout_duration": int(stats["avg_workout_duration"]) if stats["avg_workout_duration"] else 0,
                "activity_score": min(100, (stats["avg_steps"] / 10000) * 100) if stats["avg_steps"] else 0
            }
        else:
            return {
                "average_daily_steps": 0,
                "total_workouts": 0,
                "average_workout_duration": 0,
                "activity_score": 0
            }
    
    except Exception as e:
        logging.error(f"Error fetching activity data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/stress", response_model=dict)
async def get_stress_data(
    days: int = 7
):
    """Get stress level analysis"""
    try:
        stress_collection = get_collection("health_stress")
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "user_id": ObjectId("68dd3c18a48c28b2bb1aa6b2"),
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avg_stress_level": {"$avg": "$stress_level"},
                    "max_stress_level": {"$max": "$stress_level"},
                    "total_measurements": {"$sum": 1}
                }
            }
        ]
        
        result = await stress_collection.aggregate(pipeline).to_list(length=1)
        
        if result:
            stats = result[0]
            return {
                "average_stress_level": round(stats["avg_stress_level"], 1),
                "peak_stress_level": stats["max_stress_level"],
                "measurements_count": stats["total_measurements"],
                "stress_trend": "stable"  # This would be calculated based on historical data
            }
        else:
            return {
                "average_stress_level": 0,
                "peak_stress_level": 0,
                "measurements_count": 0,
                "stress_trend": "no_data"
            }
    
    except Exception as e:
        logging.error(f"Error fetching stress data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/correlations", response_model=dict)
async def get_health_productivity_correlations(
    ):
    """Get correlations between health metrics and productivity"""
    try:
        # This would involve complex analysis across multiple collections
        # For now, returning sample correlation data
        return {
            "sleep_productivity_correlation": 0.72,
            "exercise_productivity_correlation": 0.68,
            "stress_productivity_correlation": -0.45,
            "insights": [
                "Better sleep quality correlates with 15% higher productivity",
                "Regular exercise improves focus duration by average 23 minutes",
                "High stress levels reduce deep work capacity by 35%"
            ]
        }
    
    except Exception as e:
        logging.error(f"Error fetching health correlations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")