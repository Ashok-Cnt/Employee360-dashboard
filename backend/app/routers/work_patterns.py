from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.work_pattern import WorkSession, TaskSwitch, Meeting, WorkPatternSummary
from app.database import get_collection
import logging

router = APIRouter()

@router.post("/sessions", response_model=dict)
async def create_work_session(
    session_data: WorkSession
):
    """Create a new work session"""
    try:
        sessions_collection = get_collection("work_sessions")
        
        session_dict = session_data.dict()
        session_dict["user_id"] = ObjectId("68dd3c18a48c28b2bb1aa6b2")
        session_dict["created_at"] = datetime.utcnow()
        
        result = await sessions_collection.insert_one(session_dict)
        
        return {"message": "Work session created", "session_id": str(result.inserted_id)}
    
    except Exception as e:
        logging.error(f"Error creating work session: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/sessions", response_model=List[dict])
async def get_work_sessions(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    task_type: Optional[str] = Query(None)
):
    """Get work sessions for the current user"""
    try:
        sessions_collection = get_collection("work_sessions")
        
        query = {"user_id": ObjectId("68dd3c18a48c28b2bb1aa6b2")}
        
        if start_date and end_date:
            query["start_time"] = {"$gte": start_date, "$lte": end_date}
        
        if task_type:
            query["task_type"] = task_type
        
        sessions = await sessions_collection.find(query).to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        for session in sessions:
            session["_id"] = str(session["_id"])
            session["user_id"] = str(session["user_id"])
        
        return sessions
    
    except Exception as e:
        logging.error(f"Error fetching work sessions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/focus-hours", response_model=dict)
async def get_focus_hours(
    days: int = Query(7, description="Number of days to analyze")
):
    """Get focus hours analysis for the current user"""
    try:
        sessions_collection = get_collection("work_sessions")
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "user_id": ObjectId("68dd3c18a48c28b2bb1aa6b2"),
                    "task_type": "deep_work",
                    "start_time": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$start_time"}},
                    "total_hours": {"$sum": {"$divide": ["$duration_minutes", 60]}},
                    "session_count": {"$sum": 1}
                }
            },
            {
                "$sort": {"_id": 1}
            }
        ]
        
        result = await sessions_collection.aggregate(pipeline).to_list(length=None)
        
        return {
            "focus_hours_by_day": result,
            "total_focus_hours": sum([day["total_hours"] for day in result]),
            "average_daily_hours": sum([day["total_hours"] for day in result]) / days if result else 0
        }
    
    except Exception as e:
        logging.error(f"Error fetching focus hours: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/task-switching", response_model=dict)
async def get_task_switching_analysis(
    days: int = Query(7)
):
    """Get task switching analysis"""
    try:
        switches_collection = get_collection("task_switches")
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "user_id": ObjectId("68dd3c18a48c28b2bb1aa6b2"),
                    "switch_time": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$switch_time"}},
                    "switch_count": {"$sum": 1},
                    "avg_context_cost": {"$avg": "$context_switch_cost"}
                }
            },
            {
                "$sort": {"_id": 1}
            }
        ]
        
        result = await switches_collection.aggregate(pipeline).to_list(length=None)
        
        return {
            "switches_by_day": result,
            "total_switches": sum([day["switch_count"] for day in result]),
            "average_daily_switches": sum([day["switch_count"] for day in result]) / days if result else 0
        }
    
    except Exception as e:
        logging.error(f"Error fetching task switching data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/meetings", response_model=dict)
async def get_meeting_analysis(
    days: int = Query(7)
):
    """Get meeting load analysis"""
    try:
        meetings_collection = get_collection("meetings")
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "user_id": ObjectId("68dd3c18a48c28b2bb1aa6b2"),
                    "start_time": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$start_time"}},
                    "meeting_count": {"$sum": 1},
                    "total_hours": {"$sum": {"$divide": ["$duration_minutes", 60]}},
                    "avg_productivity_rating": {"$avg": "$productivity_rating"}
                }
            },
            {
                "$sort": {"_id": 1}
            }
        ]
        
        result = await meetings_collection.aggregate(pipeline).to_list(length=None)
        
        return {
            "meetings_by_day": result,
            "total_meetings": sum([day["meeting_count"] for day in result]),
            "total_meeting_hours": sum([day["total_hours"] for day in result]),
            "average_daily_meetings": sum([day["meeting_count"] for day in result]) / days if result else 0
        }
    
    except Exception as e:
        logging.error(f"Error fetching meeting data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")