"""
Application Activity Models
Pydantic models for application monitoring data
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ApplicationInfo(BaseModel):
    """Model for individual application information"""
    pid: int = Field(..., description="Process ID")
    name: str = Field(..., description="Application name")
    executable_path: str = Field(..., description="Full path to executable")
    memory_usage_mb: float = Field(..., description="Memory usage in MB")
    cpu_percent: float = Field(default=0.0, description="CPU usage percentage")
    create_time: datetime = Field(..., description="When the process was created")
    running_time_seconds: float = Field(..., description="How long the process has been running")
    timestamp: datetime = Field(..., description="When this data was captured")
    status: str = Field(default="active", description="Application status")

class FocusedWindowInfo(BaseModel):
    """Model for focused window information"""
    window_title: str = Field(..., description="Title of the focused window")
    process_name: str = Field(..., description="Name of the process")
    executable_path: str = Field(..., description="Path to the executable")
    pid: int = Field(..., description="Process ID")
    is_focused: bool = Field(default=True, description="Whether this window is currently focused")
    timestamp: datetime = Field(..., description="When this data was captured")

class SystemInfo(BaseModel):
    """Model for system information"""
    cpu_count: int = Field(..., description="Number of CPU cores")
    memory_total_gb: float = Field(..., description="Total system memory in GB")
    memory_used_gb: float = Field(..., description="Used system memory in GB")
    memory_percent: float = Field(..., description="Memory usage percentage")

class ApplicationSnapshot(BaseModel):
    """Model for a complete application monitoring snapshot"""
    id: Optional[str] = Field(None, alias="_id")
    timestamp: datetime = Field(..., description="When this snapshot was taken")
    total_applications: int = Field(..., description="Total number of applications running")
    applications: List[ApplicationInfo] = Field(..., description="List of running applications")
    focused_window: Optional[FocusedWindowInfo] = Field(None, description="Currently focused window")
    system_info: SystemInfo = Field(..., description="System resource information")

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True

class ApplicationSummary(BaseModel):
    """Model for application usage summary"""
    application_name: str = Field(..., description="Name of the application")
    total_time_minutes: float = Field(..., description="Total time spent in minutes")
    average_memory_mb: float = Field(..., description="Average memory usage in MB")
    max_memory_mb: float = Field(..., description="Peak memory usage in MB")
    launch_count: int = Field(..., description="Number of times launched")
    last_used: datetime = Field(..., description="Last time the application was used")
    usage_percentage: float = Field(..., description="Percentage of total monitored time")

class ActivityFilter(BaseModel):
    """Model for filtering application activity"""
    start_time: Optional[datetime] = Field(None, description="Start time for filtering")
    end_time: Optional[datetime] = Field(None, description="End time for filtering")
    application_name: Optional[str] = Field(None, description="Filter by application name")
    min_memory_mb: Optional[float] = Field(None, description="Minimum memory usage")
    limit: Optional[int] = Field(100, description="Maximum number of results")

class ActivityStats(BaseModel):
    """Model for activity statistics"""
    total_snapshots: int = Field(..., description="Total number of snapshots")
    unique_applications: int = Field(..., description="Number of unique applications")
    most_used_app: str = Field(..., description="Most frequently used application")
    total_monitoring_time_hours: float = Field(..., description="Total monitoring time in hours")
    average_applications_running: float = Field(..., description="Average number of apps running")
    peak_memory_usage_gb: float = Field(..., description="Peak memory usage across all apps")