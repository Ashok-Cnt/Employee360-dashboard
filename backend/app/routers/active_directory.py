from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from typing import List, Optional
from datetime import datetime
import logging

from app.models.user import User, UserADSync
from app.database import get_collection
from app.services.active_directory import ad_service
from app.auth import get_password_hash

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/test-connection")
async def test_ad_connection():
    """Test Active Directory connection"""
    try:
        result = ad_service.test_connection()
        return result
    except Exception as e:
        logger.error(f"Error testing AD connection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test AD connection: {str(e)}"
        )

@router.post("/sync-user")
async def sync_user_from_ad(sync_data: UserADSync):
    """Sync a specific user from Active Directory"""
    try:
        users_collection = get_collection("users")
        
        # Search for user in AD
        ad_user = None
        if sync_data.email:
            ad_user = ad_service.search_user_by_email(sync_data.email)
        elif sync_data.username:
            ad_user = ad_service.search_user_by_username(sync_data.username)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either email or username must be provided"
            )
        
        if not ad_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in Active Directory"
            )
        
        # Check if user already exists in database
        existing_user = None
        if ad_user.get('email'):
            existing_user = await users_collection.find_one({"email": ad_user['email']})
        elif ad_user.get('username'):
            existing_user = await users_collection.find_one({"username": ad_user['username']})
        
        if existing_user and not sync_data.force_update:
            # Update existing user with AD data
            update_data = {
                **ad_user,
                "updated_at": datetime.utcnow(),
                "ad_sync_date": datetime.utcnow()
            }
            # Don't overwrite password
            update_data.pop('hashed_password', None)
            
            await users_collection.update_one(
                {"_id": existing_user["_id"]},
                {"$set": update_data}
            )
            
            return {
                "message": "User updated from Active Directory",
                "user_id": str(existing_user["_id"]),
                "action": "updated"
            }
        else:
            # Create new user from AD data
            user_data = {
                **ad_user,
                "hashed_password": get_password_hash("changeme123"),  # Temporary password
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "ad_sync_date": datetime.utcnow()
            }
            
            result = await users_collection.insert_one(user_data)
            
            return {
                "message": "User created from Active Directory",
                "user_id": str(result.inserted_id),
                "action": "created",
                "note": "Temporary password set. User should change on first login."
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing user from AD: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync user: {str(e)}"
        )

@router.post("/bulk-sync")
async def bulk_sync_users_from_ad(background_tasks: BackgroundTasks, limit: int = 50):
    """Sync multiple users from Active Directory in the background"""
    try:
        # Add the sync operation to background tasks
        background_tasks.add_task(perform_bulk_sync, limit)
        
        return {
            "message": f"Bulk AD sync started for up to {limit} users",
            "status": "started"
        }
    
    except Exception as e:
        logger.error(f"Error starting bulk sync: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start bulk sync: {str(e)}"
        )

@router.get("/search")
async def search_ad_users(query: str, limit: int = 10):
    """Search for users in Active Directory"""
    try:
        users = []
        
        # Try searching by email first
        if "@" in query:
            user = ad_service.search_user_by_email(query)
            if user:
                users.append(user)
        else:
            # Search by username
            user = ad_service.search_user_by_username(query)
            if user:
                users.append(user)
        
        return {
            "users": users,
            "count": len(users),
            "query": query
        }
    
    except Exception as e:
        logger.error(f"Error searching AD users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search AD users: {str(e)}"
        )

@router.get("/sync-status/{user_id}")
async def get_user_sync_status(user_id: str):
    """Get AD sync status for a specific user"""
    try:
        from bson import ObjectId
        users_collection = get_collection("users")
        
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "user_id": user_id,
            "is_ad_user": user.get("is_ad_user", False),
            "ad_sync_date": user.get("ad_sync_date"),
            "ad_object_guid": user.get("ad_object_guid"),
            "last_updated": user.get("updated_at")
        }
    
    except Exception as e:
        logger.error(f"Error getting sync status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sync status: {str(e)}"
        )

async def perform_bulk_sync(limit: int):
    """Background task to sync users from AD"""
    try:
        logger.info(f"Starting bulk AD sync for {limit} users")
        
        # Get users from AD
        ad_users = ad_service.get_all_users(limit=limit)
        logger.info(f"Found {len(ad_users)} users in AD")
        
        users_collection = get_collection("users")
        created_count = 0
        updated_count = 0
        
        for ad_user in ad_users:
            try:
                # Check if user exists
                existing_user = None
                if ad_user.get('email'):
                    existing_user = await users_collection.find_one({"email": ad_user['email']})
                elif ad_user.get('username'):
                    existing_user = await users_collection.find_one({"username": ad_user['username']})
                
                if existing_user:
                    # Update existing user
                    update_data = {
                        **ad_user,
                        "updated_at": datetime.utcnow(),
                        "ad_sync_date": datetime.utcnow()
                    }
                    # Don't overwrite password
                    update_data.pop('hashed_password', None)
                    
                    await users_collection.update_one(
                        {"_id": existing_user["_id"]},
                        {"$set": update_data}
                    )
                    updated_count += 1
                else:
                    # Create new user
                    user_data = {
                        **ad_user,
                        "hashed_password": get_password_hash("changeme123"),
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                        "ad_sync_date": datetime.utcnow()
                    }
                    
                    await users_collection.insert_one(user_data)
                    created_count += 1
                    
            except Exception as e:
                logger.error(f"Error syncing user {ad_user.get('email', 'unknown')}: {e}")
                continue
        
        logger.info(f"Bulk sync completed: {created_count} created, {updated_count} updated")
        
    except Exception as e:
        logger.error(f"Error in bulk sync: {e}")

@router.post("/refresh-user/{user_id}")
async def refresh_user_from_ad(user_id: str):
    """Refresh a specific user's data from Active Directory"""
    try:
        from bson import ObjectId
        users_collection = get_collection("users")
        
        # Get current user
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Search for user in AD
        ad_user = None
        if user.get('email'):
            ad_user = ad_service.search_user_by_email(user['email'])
        elif user.get('username'):
            ad_user = ad_service.search_user_by_username(user['username'])
        
        if not ad_user:
            return {
                "message": "User not found in Active Directory",
                "user_id": user_id,
                "status": "not_found_in_ad"
            }
        
        # Update user with fresh AD data
        update_data = {
            **ad_user,
            "updated_at": datetime.utcnow(),
            "ad_sync_date": datetime.utcnow()
        }
        # Preserve existing password
        update_data.pop('hashed_password', None)
        
        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        return {
            "message": "User data refreshed from Active Directory",
            "user_id": user_id,
            "status": "updated"
        }
    
    except Exception as e:
        logger.error(f"Error refreshing user from AD: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh user: {str(e)}"
        )