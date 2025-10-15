"""
Application Activity Router
FastAPI endpoints for application monitoring data
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
import logging
from bson import ObjectId

from app.models.application_activity import (
    ApplicationSnapshot, ApplicationSummary, ActivityFilter, ActivityStats,
    ApplicationInfo, FocusedWindowInfo
)
from app.database import get_collection

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/current")
async def get_current_applications():
    """Get currently active applications"""
    try:
        collection = get_collection("application_activity")
        
        # Get all currently active applications
        cursor = collection.find(
            {"is_active": True},
            sort=[("timestamp", -1)]
        )
        
        applications = []
        async for app in cursor:
            if "_id" in app:
                app["_id"] = str(app["_id"])
            applications.append(app)
        
        return applications
        
    except Exception as e:
        logger.error(f"Error getting current applications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get current applications: {str(e)}"
        )

@router.get("/snapshots", response_model=List[ApplicationSnapshot])
async def get_application_snapshots(
    hours: int = Query(default=1, description="Number of hours to look back"),
    limit: int = Query(default=60, description="Maximum number of snapshots to return")
):
    """Get application snapshots from the specified time period"""
    try:
        collection = get_collection("application_activity")
        
        # Calculate cutoff time
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        # Query snapshots
        cursor = collection.find(
            {"timestamp": {"$gte": cutoff_time}},
            sort=[("timestamp", -1)],
            limit=limit
        )
        
        snapshots = []
        async for snapshot in cursor:
            if "_id" in snapshot:
                snapshot["_id"] = str(snapshot["_id"])
            snapshots.append(ApplicationSnapshot(**snapshot))
        
        return snapshots
        
    except Exception as e:
        logger.error(f"Error getting application snapshots: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get application snapshots: {str(e)}"
        )

@router.get("/summary", response_model=List[ApplicationSummary])
async def get_application_summary(
    hours: int = Query(default=24, description="Number of hours to analyze"),
    limit: int = Query(default=20, description="Maximum number of applications to return")
):
    """Get summarized application usage statistics"""
    try:
        collection = get_collection("application_activity")
        
        # Calculate cutoff time
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        # Aggregation pipeline to summarize application usage
        pipeline = [
            {"$match": {"timestamp": {"$gte": cutoff_time}}},
            {"$unwind": "$applications"},
            {
                "$group": {
                    "_id": "$applications.name",
                    "total_snapshots": {"$sum": 1},
                    "avg_memory_mb": {"$avg": "$applications.memory_usage_mb"},
                    "max_memory_mb": {"$max": "$applications.memory_usage_mb"},
                    "avg_cpu_percent": {"$avg": "$applications.cpu_percent"},
                    "last_used": {"$max": "$applications.timestamp"},
                    "first_seen": {"$min": "$applications.timestamp"}
                }
            },
            {
                "$project": {
                    "application_name": "$_id",
                    "total_time_minutes": {"$multiply": ["$total_snapshots", 1]},  # 1 minute per snapshot
                    "average_memory_mb": {"$round": ["$avg_memory_mb", 2]},
                    "max_memory_mb": {"$round": ["$max_memory_mb", 2]},
                    "launch_count": {"$literal": 1},  # Simplified for now
                    "last_used": 1,
                    "usage_percentage": {
                        "$multiply": [
                            {"$divide": ["$total_snapshots", {"$literal": hours * 60}]},  # Convert to percentage
                            {"$literal": 100}
                        ]
                    }
                }
            },
            {"$sort": {"total_time_minutes": -1}},
            {"$limit": limit}
        ]
        
        # Execute aggregation
        cursor = collection.aggregate(pipeline)
        summaries = []
        
        async for doc in cursor:
            summary = ApplicationSummary(
                application_name=doc["application_name"],
                total_time_minutes=doc["total_time_minutes"],
                average_memory_mb=doc["average_memory_mb"],
                max_memory_mb=doc["max_memory_mb"],
                launch_count=doc["launch_count"],
                last_used=doc["last_used"],
                usage_percentage=min(doc["usage_percentage"], 100.0)  # Cap at 100%
            )
            summaries.append(summary)
        
        return summaries
        
    except Exception as e:
        logger.error(f"Error getting application summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get application summary: {str(e)}"
        )

@router.get("/stats")
async def get_activity_stats(
    hours: int = Query(default=24, description="Number of hours to analyze")
):
    """Get overall activity statistics"""
    try:
        collection = get_collection("application_activity")
        
        # Calculate cutoff time
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        # Get basic stats for individual applications
        total_docs = await collection.count_documents({"timestamp": {"$gte": cutoff_time}})
        
        if total_docs == 0:
            return {
                "total_sessions": 0,
                "unique_applications": 0,
                "most_used_app": "None",
                "total_monitoring_time_hours": 0.0,
                "average_applications_running": 0.0,
                "peak_memory_usage_gb": 0.0,
                "currently_active_apps": 0
            }
        
        # Aggregation for detailed stats
        pipeline = [
            {"$match": {"timestamp": {"$gte": cutoff_time}}},
            {
                "$facet": {
                    "unique_apps": [
                        {"$group": {"_id": "$application"}},
                        {"$count": "count"}
                    ],
                    "most_used": [
                        {"$group": {"_id": "$application", "count": {"$sum": 1}}},
                        {"$sort": {"count": -1}},
                        {"$limit": 1}
                    ],
                    "avg_memory": [
                        {"$group": {"_id": None, "avg_memory": {"$avg": "$memory_usage_mb"}}}
                    ],
                    "peak_memory": [
                        {"$group": {"_id": None, "max_memory": {"$max": "$memory_usage_mb"}}}
                    ],
                    "avg_cpu": [
                        {"$group": {"_id": None, "avg_cpu": {"$avg": "$cpu_usage_percent"}}}
                    ]
                }
            }
        ]
        
        result = await collection.aggregate(pipeline).to_list(1)
        stats_data = result[0] if result else {}
        
        # Extract values with defaults
        unique_apps = stats_data.get("unique_apps", [{}])[0].get("count", 0)
        most_used = stats_data.get("most_used", [{}])
        most_used_app = most_used[0].get("_id", "None") if most_used else "None"
        avg_memory = stats_data.get("avg_memory", [{}])[0].get("avg_memory", 0.0)
        peak_memory = stats_data.get("peak_memory", [{}])[0].get("max_memory", 0.0)
        avg_cpu = stats_data.get("avg_cpu", [{}])[0].get("avg_cpu", 0.0)
        
        # Get currently active applications count
        currently_active = await collection.count_documents({"is_active": True})
        
        # Calculate monitoring time based on document count (each doc represents ~30 seconds)
        monitoring_hours = round((total_docs * 0.5) / 60.0, 2)  # 30 seconds per doc converted to hours
        
        return {
            "total_sessions": total_docs,
            "unique_applications": unique_apps,
            "most_used_app": most_used_app,
            "total_monitoring_time_hours": monitoring_hours,
            "average_applications_running": round(total_docs / max(1, monitoring_hours * 2), 1),  # Estimate based on docs per hour
            "peak_memory_usage_gb": round(peak_memory / 1024.0, 2),  # Convert MB to GB
            "currently_active_apps": currently_active,
            "avg_memory_mb": round(avg_memory, 2),
            "avg_cpu_percent": round(avg_cpu, 2)
        }
        
    except Exception as e:
        logger.error(f"Error getting activity stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get activity stats: {str(e)}"
        )

@router.get("/focused-window")
async def get_current_focused_window():
    """Get the currently focused window information"""
    try:
        collection = get_collection("application_activity")
        
        # Get the most recent focused application
        focused_app = await collection.find_one(
            {"is_focused": True, "is_active": True},
            sort=[("timestamp", -1)]
        )
        
        if not focused_app:
            return {"message": "No focused window data available"}
        
        # Convert ObjectId to string for JSON serialization
        if "_id" in focused_app:
            focused_app["_id"] = str(focused_app["_id"])
            
        return focused_app
        
    except Exception as e:
        logger.error(f"Error getting focused window: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get focused window: {str(e)}"
        )

@router.get("/top-memory-usage")
async def get_top_memory_usage(
    hours: int = Query(default=1, description="Number of hours to analyze"),
    limit: int = Query(default=10, description="Number of top applications to return")
):
    """Get applications with highest memory usage"""
    try:
        collection = get_collection("application_activity")
        
        # Calculate cutoff time
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        # Aggregation to find top memory users
        pipeline = [
            {"$match": {"timestamp": {"$gte": cutoff_time}}},
            {"$unwind": "$applications"},
            {
                "$group": {
                    "_id": "$applications.name",
                    "max_memory_mb": {"$max": "$applications.memory_usage_mb"},
                    "avg_memory_mb": {"$avg": "$applications.memory_usage_mb"},
                    "last_seen": {"$max": "$applications.timestamp"}
                }
            },
            {"$sort": {"max_memory_mb": -1}},
            {"$limit": limit}
        ]
        
        cursor = collection.aggregate(pipeline)
        results = []
        
        async for doc in cursor:
            results.append({
                "application_name": doc["_id"],
                "max_memory_mb": round(doc["max_memory_mb"], 2),
                "avg_memory_mb": round(doc["avg_memory_mb"], 2),
                "last_seen": doc["last_seen"]
            })
        
        return results
        
    except Exception as e:
        logger.error(f"Error getting top memory usage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get top memory usage: {str(e)}"
        )

@router.delete("/cleanup")
async def cleanup_old_data(
    days: int = Query(default=7, description="Keep data newer than this many days")
):
    """Clean up old application activity data"""
    try:
        collection = get_collection("application_activity")
        
        # Calculate cutoff time
        cutoff_time = datetime.utcnow() - timedelta(days=days)
        
        # Delete old documents
        result = await collection.delete_many({"timestamp": {"$lt": cutoff_time}})
        
        return {
            "message": f"Cleaned up old data",
            "deleted_count": result.deleted_count,
            "cutoff_date": cutoff_time
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup data: {str(e)}"
        )