from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import json
import os

router = APIRouter()

# File path to store category configuration
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
CATEGORY_CONFIG_FILE = os.path.join(DATA_DIR, 'category_config.json')
ACTIVITY_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data-collector', 'activity_data')

# Pydantic models
class Application(BaseModel):
    name: str

class Category(BaseModel):
    id: str
    name: str
    icon: str
    color: str
    applications: List[str]

class CategoriesConfig(BaseModel):
    categories: List[Category]

# Default categories
DEFAULT_CATEGORIES = [
    {
        'id': 'productivity',
        'name': 'Productivity',
        'icon': 'Work',
        'color': '#4caf50',
        'applications': [
            'Visual Studio Code',
            'IntelliJ IDEA',
            'Eclipse',
            'PyCharm',
            'Sublime Text',
            'Notepad++',
            'Microsoft Excel',
            'Microsoft Word',
            'Microsoft PowerPoint',
            'Google Chrome',
            'Firefox',
            'Edge',
            'Notepad'
        ]
    },
    {
        'id': 'communication',
        'name': 'Communication',
        'icon': 'People',
        'color': '#2196f3',
        'applications': [
            'Microsoft Teams',
            'Slack',
            'Zoom',
            'Discord',
            'Skype',
            'Outlook',
            'Gmail',
            'Thunderbird'
        ]
    },
    {
        'id': 'break',
        'name': 'Break',
        'icon': 'Coffee',
        'color': '#ff9800',
        'applications': [
            'YouTube',
            'Spotify',
            'Netflix',
            'Steam',
            'Epic Games',
            'Twitter',
            'Facebook',
            'Instagram',
            'Reddit'
        ]
    }
]

def ensure_data_directory():
    """Ensure the data directory exists"""
    os.makedirs(DATA_DIR, exist_ok=True)

def load_categories() -> Dict[str, Any]:
    """Load categories from file or return defaults"""
    try:
        if os.path.exists(CATEGORY_CONFIG_FILE):
            with open(CATEGORY_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            # Create default config file
            ensure_data_directory()
            default_config = {'categories': DEFAULT_CATEGORIES}
            save_categories(default_config)
            return default_config
    except Exception as e:
        print(f"Error loading categories: {e}")
        return {'categories': DEFAULT_CATEGORIES}

def save_categories(data: Dict[str, Any]) -> bool:
    """Save categories to file"""
    try:
        ensure_data_directory()
        with open(CATEGORY_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving categories: {e}")
        return False

def get_category_for_app(app_name: str) -> str:
    """Get the category for a specific application"""
    categories = load_categories()
    for category in categories.get('categories', []):
        if app_name in category.get('applications', []):
            return category['id']
    return 'productivity'  # Default category

@router.get("/categories")
async def get_categories():
    """Get all categories"""
    try:
        data = load_categories()
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error loading categories: {str(e)}"
        )

@router.post("/categories")
async def update_categories(config: CategoriesConfig):
    """Update categories configuration"""
    try:
        # Convert to dict and add timestamp
        data = config.dict()
        data['updated_at'] = datetime.now().isoformat()
        
        if save_categories(data):
            return {
                'message': 'Categories updated successfully',
                'data': data
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save categories"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating categories: {str(e)}"
        )

@router.get("/categories/{category_id}")
async def get_category(category_id: str):
    """Get a specific category"""
    try:
        data = load_categories()
        for category in data.get('categories', []):
            if category['id'] == category_id:
                return category
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting category: {str(e)}"
        )

@router.get("/categories/app/{app_name}")
async def get_app_category(app_name: str):
    """Get the category for a specific application"""
    try:
        category_id = get_category_for_app(app_name)
        return {
            'app_name': app_name,
            'category': category_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting app category: {str(e)}"
        )

@router.get("/applications")
async def get_all_applications():
    """Get all unique applications from activity data"""
    try:
        applications = set()
        
        # Get applications from activity data files
        if os.path.exists(ACTIVITY_DATA_DIR):
            for filename in os.listdir(ACTIVITY_DATA_DIR):
                if filename.endswith('.jsonl'):
                    filepath = os.path.join(ACTIVITY_DATA_DIR, filename)
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            for line in f:
                                try:
                                    entry = json.loads(line)
                                    # Get apps from main apps array
                                    if 'apps' in entry:
                                        for app in entry['apps']:
                                            if 'title' in app and app['title']:
                                                applications.add(app['title'])
                                    # Get apps from background apps
                                    if 'backgroundApps' in entry and 'apps' in entry['backgroundApps']:
                                        for app in entry['backgroundApps']['apps']:
                                            if 'title' in app and app['title']:
                                                applications.add(app['title'])
                                except json.JSONDecodeError:
                                    continue
                    except Exception as e:
                        print(f"Error reading file {filename}: {e}")
                        continue
        
        # Also add applications from categories (to ensure configured apps are shown)
        categories_data = load_categories()
        for category in categories_data.get('categories', []):
            applications.update(category.get('applications', []))
        
        # Filter out empty strings and system apps
        filtered_apps = [app for app in applications if app and app.strip() and not app.startswith('System')]
        
        return {
            'applications': sorted(list(filtered_apps))
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting applications: {str(e)}"
        )

@router.post("/categories/reset")
async def reset_categories():
    """Reset categories to default"""
    try:
        data = {
            'categories': DEFAULT_CATEGORIES,
            'updated_at': datetime.now().isoformat()
        }
        if save_categories(data):
            return {
                'message': 'Categories reset to default',
                'data': data
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to reset categories"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting categories: {str(e)}"
        )
