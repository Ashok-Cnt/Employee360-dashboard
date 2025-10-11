from bson import ObjectId
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from app.database import get_collection
import logging

router = APIRouter()

@router.get("/courses", response_model=List[dict])
async def get_completed_courses(
    ):
    """Get completed courses for the current user"""
    try:
        courses_collection = get_collection("completed_courses")
        
        courses = await courses_collection.find({"user_id": ObjectId("68dd3c18a48c28b2bb1aa6b2")}).to_list(length=None)
        
        for course in courses:
            course["_id"] = str(course["_id"])
            course["user_id"] = str(course["user_id"])
        
        return courses
    
    except Exception as e:
        logging.error(f"Error fetching courses: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/skills", response_model=dict)
async def get_skill_growth(
    ):
    """Get skill growth analysis"""
    try:
        # This would typically involve more complex analysis
        # For now, returning mock data structure
        return {
            "skills": [
                {"name": "Python", "level": 8.5, "progress": 0.15},
                {"name": "JavaScript", "level": 7.8, "progress": 0.12},
                {"name": "React", "level": 8.2, "progress": 0.20},
                {"name": "Machine Learning", "level": 6.5, "progress": 0.25}
            ],
            "total_learning_hours": 124.5,
            "courses_completed": 12,
            "certifications": 3
        }
    
    except Exception as e:
        logging.error(f"Error fetching skill growth: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/recommendations", response_model=List[dict])
async def get_learning_recommendations(
    ):
    """Get personalized learning recommendations"""
    try:
        # This would involve AI analysis of user's current skills and goals
        recommendations = [
            {
                "title": "Advanced React Patterns",
                "provider": "Frontend Masters",
                "difficulty": "Advanced",
                "estimated_hours": 8,
                "relevance_score": 0.92,
                "reason": "Based on your React usage patterns"
            },
            {
                "title": "Deep Learning Specialization",
                "provider": "Coursera",
                "difficulty": "Intermediate",
                "estimated_hours": 40,
                "relevance_score": 0.88,
                "reason": "Aligns with your ML learning goals"
            }
        ]
        
        return recommendations
    
    except Exception as e:
        logging.error(f"Error fetching recommendations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")