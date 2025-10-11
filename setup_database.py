#!/usr/bin/env python3
"""
Database setup script for Employee360
This script creates all collections with validation schemas and sample data
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import random
from bson import ObjectId

# MongoDB connection string
MONGODB_URL = "mongodb+srv://employee360:admin@employee360.n05xtqd.mongodb.net/"
DATABASE_NAME = "employee360"

async def create_collections(db):
    """Create all collections with validation schemas"""
    
    # Users collection
    await db.create_collection("users", validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["email", "username", "hashed_password"],
            "properties": {
                "email": {
                    "bsonType": "string",
                    "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                    "description": "must be a valid email"
                },
                "username": {
                    "bsonType": "string",
                    "minLength": 3,
                    "maxLength": 50,
                    "description": "must be a string between 3-50 characters"
                },
                "hashed_password": {
                    "bsonType": "string",
                    "description": "must be a hashed password string"
                },
                "is_active": {
                    "bsonType": "bool",
                    "description": "user account status"
                }
            }
        }
    })

    # Work sessions collection
    await db.create_collection("work_sessions", validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["user_id", "start_time", "task_type"],
            "properties": {
                "user_id": {"bsonType": "objectId"},
                "start_time": {"bsonType": "date"},
                "end_time": {"bsonType": "date"},
                "duration_minutes": {"bsonType": "number", "minimum": 0},
                "task_type": {
                    "bsonType": "string",
                    "enum": ["deep_work", "meeting", "email", "planning", "learning", "break", "other"]
                },
                "application_name": {"bsonType": "string"},
                "productivity_score": {"bsonType": "number", "minimum": 0, "maximum": 1}
            }
        }
    })

    # Other collections (simplified for quick setup)
    collections = [
        "meetings", "completed_courses", "health_sleep", 
        "health_activity", "health_stress", "user_feedback", "task_switches"
    ]
    
    for collection_name in collections:
        try:
            await db.create_collection(collection_name)
        except Exception as e:
            print(f"Collection {collection_name} might already exist: {e}")

    print("✅ Collections created successfully!")

async def create_indexes(db):
    """Create indexes for better performance"""
    
    # Users indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    
    # Work sessions indexes
    await db.work_sessions.create_index([("user_id", 1), ("start_time", -1)])
    await db.work_sessions.create_index([("user_id", 1), ("task_type", 1)])
    
    # Health data indexes
    await db.health_sleep.create_index([("user_id", 1), ("date", -1)])
    await db.health_activity.create_index([("user_id", 1), ("date", -1)])
    
    print("✅ Indexes created successfully!")

async def insert_sample_data(db):
    """Insert sample data for testing"""
    
    # Create sample user
    sample_user_id = ObjectId()
    sample_user = {
        "_id": sample_user_id,
        "email": "demo@example.com",
        "username": "demo_user",
        "full_name": "Demo User",
        "hashed_password": "$2b$12$dummy.hash.for.demo.purposes.only",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    try:
        await db.users.insert_one(sample_user)
        print("✅ Sample user created!")
    except Exception as e:
        print(f"User might already exist: {e}")

    # Sample work sessions
    work_sessions = []
    for i in range(10):
        hours_ago = i * 2 + 1
        work_sessions.append({
            "user_id": sample_user_id,
            "start_time": datetime.utcnow() - timedelta(hours=hours_ago),
            "end_time": datetime.utcnow() - timedelta(hours=hours_ago-1),
            "duration_minutes": 60 + random.randint(-20, 40),
            "task_type": random.choice(["deep_work", "meeting", "email", "planning", "learning"]),
            "application_name": random.choice(["VS Code", "Teams", "Outlook", "Chrome", "Notion"]),
            "productivity_score": 0.5 + random.random() * 0.5,
            "created_at": datetime.utcnow()
        })
    
    await db.work_sessions.insert_many(work_sessions)
    print("✅ Sample work sessions created!")

    # Sample health data - sleep
    sleep_data = []
    for i in range(7):
        date = datetime.utcnow() - timedelta(days=i)
        sleep_data.append({
            "user_id": sample_user_id,
            "date": date,
            "bedtime": date.replace(hour=23, minute=0),
            "wake_time": date.replace(hour=7, minute=30),
            "duration_hours": 7.5 + (random.random() - 0.5),
            "quality_score": 7 + random.random() * 2,
            "deep_sleep_minutes": 90 + random.randint(-20, 30),
            "created_at": datetime.utcnow()
        })
    
    await db.health_sleep.insert_many(sleep_data)
    print("✅ Sample sleep data created!")

    # Sample health data - activity
    activity_data = []
    for i in range(7):
        date = datetime.utcnow() - timedelta(days=i)
        activity_data.append({
            "user_id": sample_user_id,
            "date": date,
            "steps": 8000 + random.randint(-2000, 4000),
            "distance_km": 5 + random.random() * 3,
            "active_minutes": 30 + random.randint(0, 60),
            "workout_count": random.randint(0, 2),
            "calories_burned": 2000 + random.randint(-200, 500),
            "created_at": datetime.utcnow()
        })
    
    await db.health_activity.insert_many(activity_data)
    print("✅ Sample activity data created!")

    # Sample completed courses
    courses = [
        {
            "user_id": sample_user_id,
            "course_title": "Advanced React Patterns",
            "provider": "Frontend Masters",
            "completion_date": datetime.utcnow() - timedelta(days=7),
            "duration_hours": 8,
            "skill_tags": ["React", "JavaScript", "Frontend"],
            "rating": 5,
            "created_at": datetime.utcnow()
        },
        {
            "user_id": sample_user_id,
            "course_title": "Python for Data Science",
            "provider": "Coursera", 
            "completion_date": datetime.utcnow() - timedelta(days=14),
            "duration_hours": 12,
            "skill_tags": ["Python", "Data Science", "Machine Learning"],
            "rating": 4,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.completed_courses.insert_many(courses)
    print("✅ Sample course data created!")

    print(f"✅ Sample data inserted successfully!")
    print(f"Sample user ID: {sample_user_id}")
    print("Demo login: demo@example.com")

async def main():
    """Main setup function"""
    
    print("🚀 Starting Employee360 database setup...")
    print(f"Connecting to: {MONGODB_URL}")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas!")
        
        # Setup database
        await create_collections(db)
        await create_indexes(db)
        await insert_sample_data(db)
        
        print("🎉 Database setup completed successfully!")
        print(f"Database: {DATABASE_NAME}")
        print("Ready for Employee360 application!")
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())