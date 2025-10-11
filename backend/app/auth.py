import hashlib
from datetime import datetime, timedelta
from typing import Optional
import os

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using simple SHA256"""
    # Truncate password to 72 bytes if needed (for compatibility)
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = plain_password[:72]
    
    # Simple SHA256 hash verification
    password_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    return password_hash == hashed_password

def get_password_hash(password: str) -> str:
    """Hash a password using simple SHA256"""
    # Truncate password to 72 bytes if needed (for compatibility)
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    
    # Simple SHA256 hash
    return hashlib.sha256(password.encode('utf-8')).hexdigest()