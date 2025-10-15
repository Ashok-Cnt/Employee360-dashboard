#!/usr/bin/env python3
"""
Add realistic application activity data based on current system
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import random
from bson import ObjectId

# MongoDB connection
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "employee360"

async def add_realistic_application_activity_data(db):
    """Add realistic application activity data based on current Windows system"""
    
    # Get the existing demo user
    demo_user = await db.users.find_one({"email": "demo@example.com"})
    if not demo_user:
        print("Demo user not found. Please run setup_database.py first.")
        return
    
    user_id = demo_user["_id"]
    
    # Realistic applications based on your actual current system (NO Chrome!)
    applications = [
        {"name": "Visual Studio Code", "category": "Development", "productivity_score": 0.95, "base_memory": 120},
        {"name": "Microsoft Edge", "category": "Browser", "productivity_score": 0.8, "base_memory": 150},
        {"name": "MongoDB Compass", "category": "Database", "productivity_score": 0.9, "base_memory": 140},
        {"name": "PowerShell", "category": "Development", "productivity_score": 0.9, "base_memory": 25},
        {"name": "Windows Terminal", "category": "Development", "productivity_score": 0.9, "base_memory": 30},
        {"name": "Task Manager", "category": "System", "productivity_score": 0.6, "base_memory": 35},
        {"name": "Windows Explorer", "category": "System", "productivity_score": 0.7, "base_memory": 40},
        {"name": "Python", "category": "Development", "productivity_score": 0.95, "base_memory": 45},
        {"name": "Node.js", "category": "Development", "productivity_score": 0.9, "base_memory": 60},
        {"name": "Windows Settings", "category": "System", "productivity_score": 0.5, "base_memory": 25},
        {"name": "Notepad", "category": "Development", "productivity_score": 0.7, "base_memory": 15},
    ]
    
    # Generate realistic snapshots for the last 8 hours (work day)
    snapshots = []
    
    # Start from 8 hours ago, snapshot every 2 minutes
    for minutes_ago in range(0, 8 * 60, 2):  # Every 2 minutes for 8 hours
        timestamp = datetime.utcnow() - timedelta(minutes=minutes_ago)
        
        # Simulate realistic work patterns
        hour_of_day = timestamp.hour
        
        # More apps during active work hours (9 AM - 6 PM)
        if 9 <= hour_of_day <= 18:
            num_apps = random.randint(4, 8)
            activity_multiplier = 1.0
        else:
            num_apps = random.randint(2, 4)
            activity_multiplier = 0.5
        
        # Select applications with higher probability for development tools
        dev_apps = [app for app in applications if app["category"] == "Development"]
        other_apps = [app for app in applications if app["category"] != "Development"]
        
        # Ensure VS Code is almost always running during work hours
        running_apps = []
        if 9 <= hour_of_day <= 18 and random.random() > 0.1:  # 90% chance VS Code is running
            running_apps.append(next(app for app in applications if app["name"] == "Visual Studio Code"))
            num_apps -= 1
        
        # Add other development tools with high probability
        dev_sample_size = min(num_apps - len(running_apps), len(dev_apps) - len(running_apps))
        if dev_sample_size > 0:
            running_apps.extend(random.sample([app for app in dev_apps if app not in running_apps], 
                                            min(dev_sample_size, random.randint(1, 3))))
        
        # Fill remaining slots with other apps
        remaining_slots = num_apps - len(running_apps)
        if remaining_slots > 0:
            available_apps = [app for app in other_apps if app not in running_apps]
            if available_apps:
                running_apps.extend(random.sample(available_apps, min(remaining_slots, len(available_apps))))
        
        app_list = []
        total_memory = 0
        
        for i, app in enumerate(running_apps):
            # Realistic memory usage with some variation
            memory_variation = random.uniform(0.8, 1.4)  # ±40% variation
            memory_usage = int(app["base_memory"] * memory_variation * activity_multiplier)
            total_memory += memory_usage
            
            # Realistic CPU usage - lower for most apps, higher during active use
            if app["name"] == "Visual Studio Code" and random.random() > 0.7:  # Sometimes VS Code is actively compiling
                cpu_usage = random.uniform(15, 45)
            elif app["category"] == "Development" and random.random() > 0.8:
                cpu_usage = random.uniform(10, 30)
            else:
                cpu_usage = random.uniform(0.1, 8.0)
            
            app_info = {
                "pid": 1000 + i + int(timestamp.timestamp()) % 1000,
                "name": app["name"],
                "executable_path": f"C:\\Program Files\\{app['name'].replace(' ', '')}\\{app['name'].replace(' ', '')}.exe",
                "memory_usage_mb": memory_usage,
                "cpu_percent": round(cpu_usage, 2),
                "create_time": timestamp - timedelta(hours=random.randint(1, 12)),
                "running_time_seconds": random.randint(600, 28800),  # 10 minutes to 8 hours
                "timestamp": timestamp,
                "status": "active"
            }
            app_list.append(app_info)
        
        # Create focused window info - prioritize development tools during work hours
        if running_apps:
            if 9 <= hour_of_day <= 18:
                # During work hours, focus more on development tools
                dev_running = [app for app in running_apps if app["category"] == "Development"]
                focused_app = random.choice(dev_running if dev_running else running_apps)
            else:
                focused_app = random.choice(running_apps)
            
            window_titles = {
                "Visual Studio Code": [
                    "Employee360-dashboard - Visual Studio Code",
                    "main.py - Employee360-dashboard - Visual Studio Code",
                    "backend/app/routers/application_activity.py - Employee360-dashboard - Visual Studio Code",
                    "add_realistic_app_data.py - Employee360-dashboard - Visual Studio Code"
                ],
                "Microsoft Edge": [
                    "Employee360 Dashboard - Microsoft Edge",
                    "MongoDB Documentation - Microsoft Edge",
                    "Simple Browser - Employee360-dashboard - Visual Studio Code",
                    "GitHub - Employee360-dashboard - Microsoft Edge"
                ],
                "MongoDB Compass": [
                    "MongoDB Compass - employee360/application_activity",
                    "MongoDB Compass - localhost:27017",
                    "MongoDB Compass - employee360/work_sessions"
                ],
                "PowerShell": [
                    "Windows PowerShell",
                    "PowerShell 7 - Employee360-dashboard",
                    "Administrator: Windows PowerShell"
                ],
                "Python": [
                    "Python 3.14.0 Shell",
                    "Python - main.py",
                    "Python - add_realistic_app_data.py"
                ]
            }
            
            window_title = random.choice(window_titles.get(focused_app["name"], [f"{focused_app['name']} - Active Window"]))
            
            focused_window = {
                "window_title": window_title,
                "process_name": focused_app["name"],
                "executable_path": f"C:\\Program Files\\{focused_app['name'].replace(' ', '')}\\{focused_app['name'].replace(' ', '')}.exe",
                "pid": random.randint(1000, 9999),
                "is_focused": True,
                "timestamp": timestamp
            }
        else:
            focused_window = None
        
        # Create realistic system info
        system_info = {
            "cpu_count": 8,
            "memory_total_gb": 16.0,
            "memory_used_gb": round((total_memory + random.randint(2000, 4000)) / 1024.0, 2),  # Include OS overhead
            "memory_percent": round(((total_memory + random.randint(2000, 4000)) / 1024.0) / 16.0 * 100, 1)
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
    print(f"✅ Added {len(snapshots)} realistic application activity snapshots!")
    
    # Generate summary statistics
    total_time = len(snapshots) * 2 / 60  # 2 minutes per snapshot, convert to hours
    vs_code_snapshots = sum(1 for s in snapshots if any(app["name"] == "Visual Studio Code" for app in s["applications"]))
    dev_tool_snapshots = sum(1 for s in snapshots if any(app["category"] == "Development" for app in s["applications"]))
    
    print(f"📊 Total monitoring time: {total_time:.1f} hours")
    print(f"📊 Snapshots created: {len(snapshots)}")
    print(f"📊 Average apps per snapshot: {sum(len(s['applications']) for s in snapshots) / len(snapshots):.1f}")
    print(f"📊 VS Code usage: {(vs_code_snapshots/len(snapshots)*100):.1f}% of time")
    print(f"📊 Development tools usage: {(dev_tool_snapshots/len(snapshots)*100):.1f}% of time")

async def main():
    """Main function"""
    print("🚀 Adding realistic application activity data...")
    print(f"Connecting to: {MONGODB_URL}")
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB!")
        
        # Add realistic application activity data
        await add_realistic_application_activity_data(db)
        
        print("🎉 Realistic application activity data added successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())