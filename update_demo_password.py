#!/usr/bin/env python3
"""
Update the demo user password to use the new SHA256 hashing
"""

import asyncio
import hashlib
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# MongoDB connection string
MONGODB_URL = "mongodb+srv://employee360:admin@employee360.n05xtqd.mongodb.net/"
DATABASE_NAME = "employee360"

def get_password_hash(password: str) -> str:
    """Hash a password using simple SHA256"""
    # Truncate password to 72 bytes if needed (for compatibility)
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    
    # Simple SHA256 hash
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

async def update_demo_user():
    """Update the demo user password hash"""
    
    print("🔧 Updating demo user password hash...")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        # Update the demo user with new password hash
        demo_password = "demo123"
        new_hash = get_password_hash(demo_password)
        
        result = await db.users.update_one(
            {"email": "demo@example.com"},
            {"$set": {"hashed_password": new_hash}}
        )
        
        if result.modified_count > 0:
            print("✅ Demo user password updated successfully!")
            print(f"Email: demo@example.com")
            print(f"Password: {demo_password}")
        else:
            print("❌ Demo user not found or not updated")
        
    except Exception as e:
        print(f"❌ Error updating demo user: {e}")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(update_demo_user())