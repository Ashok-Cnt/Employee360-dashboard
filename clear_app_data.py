#!/usr/bin/env python3
"""
Clear existing application activity data
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def clear_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["employee360"]
    result = await db.application_activity.delete_many({})
    print(f"Deleted {result.deleted_count} documents")
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_data())