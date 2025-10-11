#!/usr/bin/env python3
"""
Script to remove authentication from all FastAPI routers
"""

import os
import re

def remove_auth_from_file(file_path):
    """Remove authentication dependencies from a Python file"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove imports
    content = re.sub(r'from app\.auth import.*\n', '', content)
    content = re.sub(r'from app\.models\.user import User.*\n', '', content)
    content = re.sub(r', Depends', '', content)
    content = re.sub(r'from fastapi import (.*), Depends', r'from fastapi import \1', content)
    
    # Remove current_user parameters from function definitions
    content = re.sub(r',\s*current_user: User = Depends\(get_current_user\)', '', content)
    content = re.sub(r'current_user: User = Depends\(get_current_user\),?\s*', '', content)
    
    # Remove current_user.id references and replace with a sample user ID
    content = re.sub(r'current_user\.id', 'ObjectId("68dd3c18a48c28b2bb1aa6b2")', content)
    content = re.sub(r'current_user\._id', 'ObjectId("68dd3c18a48c28b2bb1aa6b2")', content)
    
    # Add ObjectId import if needed
    if 'ObjectId("68dd3c18a48c28b2bb1aa6b2")' in content and 'from bson import ObjectId' not in content:
        content = 'from bson import ObjectId\n' + content
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Removed auth from {file_path}")

# Process all router files
router_files = [
    'c:/Users/Gbs05262/HackathonWorkSpace/Employee360-dashboard/backend/app/routers/work_patterns.py',
    'c:/Users/Gbs05262/HackathonWorkSpace/Employee360-dashboard/backend/app/routers/learning.py',
    'c:/Users/Gbs05262/HackathonWorkSpace/Employee360-dashboard/backend/app/routers/health.py',
    'c:/Users/Gbs05262/HackathonWorkSpace/Employee360-dashboard/backend/app/routers/insights.py'
]

for file_path in router_files:
    if os.path.exists(file_path):
        remove_auth_from_file(file_path)
    else:
        print(f"File not found: {file_path}")

print("✅ Authentication removed from all router files!")
print("Using sample user ID: 68dd3c18a48c28b2bb1aa6b2 (from our sample data)")