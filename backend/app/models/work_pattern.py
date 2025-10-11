from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from bson import ObjectId
from .user import PyObjectId

class WorkSession(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    task_type: str  # 'deep_work', 'meeting', 'email', 'planning', 'learning'
    application_name: Optional[str] = None
    website_url: Optional[str] = None
    productivity_score: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class TaskSwitch(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    from_task: str
    to_task: str
    switch_time: datetime
    context_switch_cost: Optional[float] = None  # estimated productivity loss
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Meeting(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    title: str
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    attendees_count: Optional[int] = None
    meeting_type: str  # 'standup', 'planning', 'review', 'one_on_one', 'other'
    productivity_rating: Optional[int] = Field(None, ge=1, le=5)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class WorkPatternSummary(BaseModel):
    user_id: PyObjectId
    date: datetime
    total_work_hours: float
    deep_work_hours: float
    meeting_hours: float
    task_switches: int
    productivity_score: float
    top_applications: List[Dict[str, any]]
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}