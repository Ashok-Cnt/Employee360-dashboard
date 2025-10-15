#!/usr/bin/env python3
"""
Check application activity data in MongoDB
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["employee360"]
    
    # Count documents
    count = await db.application_activity.count_documents({})
    print(f"Total application activity documents: {count}")
    
    if count > 0:
        # Get one sample document
        sample = await db.application_activity.find_one({})
        print("\nSample document structure:")
        for key in sample.keys():
            if key == "applications":
                print(f"  {key}: [{len(sample[key])} applications]")
                if sample[key]:
                    print(f"    Sample app: {sample[key][0]['name']}")
            elif key == "_id":
                print(f"  {key}: {str(sample[key])}")
            else:
                print(f"  {key}: {sample[key]}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_data())