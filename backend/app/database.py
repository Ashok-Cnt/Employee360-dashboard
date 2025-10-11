from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    client: AsyncIOMotorClient = None
    database = None

db = Database()

async def get_database():
    return db.database

async def connect_to_mongo():
    """Create database connection"""
    # Try DATABASE_URL first, then MONGODB_URL for backward compatibility
    mongodb_url = os.getenv("DATABASE_URL") or os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db.client = AsyncIOMotorClient(mongodb_url)
    db.database = db.client[os.getenv("DATABASE_NAME", "employee360")]
    print(f"Connected to MongoDB: {mongodb_url}")

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")

def get_collection(collection_name: str):
    """Get a specific collection"""
    return db.database[collection_name]