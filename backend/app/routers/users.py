from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.user import User, UserCreate, UserUpdate
from app.database import get_collection
from app.auth import get_password_hash, verify_password
import logging

router = APIRouter()

@router.post("/register", response_model=dict)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        users_collection = get_collection("users")
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password and create user
        hashed_password = get_password_hash(user_data.password)
        user_dict = user_data.dict(exclude={"password"})
        user_dict["hashed_password"] = hashed_password
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        
        result = await users_collection.insert_one(user_dict)
        
        return {"message": "User registered successfully", "user_id": str(result.inserted_id)}
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error registering user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/login")
async def login_user(email: str, password: str):
    """Login user (simplified without JWT)"""
    try:
        users_collection = get_collection("users")
        
        user = await users_collection.find_one({"email": email})
        if not user or not verify_password(password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        return {
            "message": "Login successful",
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "username": user["username"],
                "full_name": user.get("full_name")
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error logging in user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/list")
async def get_all_users():
    """Get all users (for testing without auth)"""
    try:
        users_collection = get_collection("users")
        users = []
        async for user in users_collection.find({}, {"hashed_password": 0}):  # Exclude password
            user["id"] = str(user["_id"])
            del user["_id"]
            users.append(user)
        return {"users": users}
    except Exception as e:
        logging.error(f"Error getting users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/{user_id}")
async def get_user_by_id(user_id: str):
    """Get user by ID (simplified without auth)"""
    try:
        from bson import ObjectId
        users_collection = get_collection("users")
        
        user = await users_collection.find_one(
            {"_id": ObjectId(user_id)}, 
            {"hashed_password": 0}  # Exclude password
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user["id"] = str(user["_id"])
        del user["_id"]
        return user
    
    except Exception as e:
        logging.error(f"Error getting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.put("/{user_id}")
async def update_user_by_id(user_id: str, user_update: UserUpdate):
    """Update user by ID (simplified without auth)"""
    try:
        from bson import ObjectId
        users_collection = get_collection("users")
        
        update_data = user_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"message": "User updated successfully"}
    
    except Exception as e:
        logging.error(f"Error updating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )