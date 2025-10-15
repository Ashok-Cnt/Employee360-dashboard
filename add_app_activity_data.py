#!/usr/bin/env python3
"""
Add sample application activity data to MongoDB
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import random
from bson import ObjectId

# MongoDB connection
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "employee360"

async def add_application_activity_data(db):
    """Add sample application activity data in the correct format"""
    
    # Get the existing demo user
    demo_user = await db.users.find_one({"email": "demo@example.com"})
    if not demo_user:
        print("Demo user not found. Please run setup_database.py first.")
        return
    
    user_id = demo_user["_id"]
    
    # Sample applications and their typical usage
    applications = [
        {"name": "Visual Studio Code", "category": "Development", "productivity_score": 0.95},
        {"name": "Google Chrome", "category": "Browser", "productivity_score": 0.7},
        {"name": "Microsoft Teams", "category": "Communication", "productivity_score": 0.8},
        {"name": "Outlook", "category": "Email", "productivity_score": 0.75},
        {"name": "Slack", "category": "Communication", "productivity_score": 0.8},
        {"name": "Notion", "category": "Productivity", "productivity_score": 0.9},
        {"name": "Figma", "category": "Design", "productivity_score": 0.85},
        {"name": "Discord", "category": "Communication", "productivity_score": 0.3},
        {"name": "Spotify", "category": "Entertainment", "productivity_score": 0.4},
        {"name": "Terminal", "category": "Development", "productivity_score": 0.9},
    ]
    
    # Generate snapshots for the last 24 hours (one per 5 minutes)
    snapshots = []
    
    for minutes_ago in range(0, 24 * 60, 5):  # Every 5 minutes for 24 hours
        timestamp = datetime.utcnow() - timedelta(minutes=minutes_ago)
        
        # Generate 3-8 running applications for this snapshot
        num_apps = random.randint(3, 8)
        running_apps = random.sample(applications, num_apps)
        
        app_list = []
        total_memory = 0
        
        for i, app in enumerate(running_apps):
            memory_usage = random.randint(50, 2000)
            total_memory += memory_usage
            
            app_info = {
                "pid": 1000 + i,
                "name": app["name"],
                "executable_path": f"C:\\Program Files\\{app['name']}\\{app['name'].replace(' ', '')}.exe",
                "memory_usage_mb": memory_usage,
                "cpu_percent": random.uniform(0.1, 25.0),
                "create_time": timestamp - timedelta(hours=random.randint(1, 24)),
                "running_time_seconds": random.randint(300, 7200),
                "timestamp": timestamp,
                "status": "active"
            }
            app_list.append(app_info)
        
        # Create focused window info (pick a random app from running apps)
        focused_app = random.choice(running_apps)
        focused_window = {
            "window_title": f"{focused_app['name']} - Current Project",
            "process_name": focused_app["name"],
            "executable_path": f"C:\\Program Files\\{focused_app['name']}\\{focused_app['name'].replace(' ', '')}.exe",
            "pid": random.randint(1000, 9999),
            "is_focused": True,
            "timestamp": timestamp
        }
        
        # Create system info
        system_info = {
            "cpu_count": 8,
            "memory_total_gb": 16.0,
            "memory_used_gb": total_memory / 1024.0,
            "memory_percent": (total_memory / 1024.0) / 16.0 * 100
        }
        
        # Create the complete snapshot
        snapshot = {
            "timestamp": timestamp,
            "total_applications": len(app_list),
            "applications": app_list,
            "focused_window": focused_window,
            "system_info": system_info,
            "created_at": datetime.utcnow()
        }
        
        snapshots.append(snapshot)
    
    # Insert all snapshots
    await db.application_activity.insert_many(snapshots)
    print(f"✅ Added {len(snapshots)} application activity snapshots!")
    
    # Generate some summary statistics
    total_time = len(snapshots) * 5 / 60  # 5 minutes per snapshot, convert to hours
    print(f"📊 Total monitoring time: {total_time:.1f} hours")
    print(f"📊 Snapshots created: {len(snapshots)}")
    print(f"📊 Average apps per snapshot: {sum(len(s['applications']) for s in snapshots) / len(snapshots):.1f}")

async def main():
    """Main function"""
    print("🚀 Adding application activity data...")
    print(f"Connecting to: {MONGODB_URL}")
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB!")
        
        # Add application activity data
        await add_application_activity_data(db)
        
        print("🎉 Application activity data added successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())