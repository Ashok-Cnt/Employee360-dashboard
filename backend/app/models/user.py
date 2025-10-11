from pydantic import BaseModel, Field, field_validator, ConfigDict
from pydantic_core import core_schema
from typing import Optional, List, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler
    ) -> core_schema.CoreSchema:
        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

class User(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    email: str
    username: str
    full_name: Optional[str] = None
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Active Directory fields
    ad_object_guid: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    user_principal_name: Optional[str] = None
    
    # Organizational information
    department: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    manager_dn: Optional[str] = None
    manager_name: Optional[str] = None
    
    # Contact information
    phone_number: Optional[str] = None
    mobile_number: Optional[str] = None
    office_location: Optional[str] = None
    
    # Address information
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    
    # AD metadata
    groups: Optional[List[str]] = []
    account_created: Optional[datetime] = None
    last_logon: Optional[datetime] = None
    account_expires: Optional[datetime] = None
    ad_sync_date: Optional[datetime] = None
    is_ad_user: bool = False

class UserCreate(BaseModel):
    email: str
    username: str
    full_name: Optional[str] = None
    password: str
    
    # Optional AD fields for manual entry
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    phone_number: Optional[str] = None
    mobile_number: Optional[str] = None
    office_location: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    
    # AD fields that can be updated
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    phone_number: Optional[str] = None
    mobile_number: Optional[str] = None
    office_location: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

class UserADSync(BaseModel):
    """Model for AD sync request"""
    email: Optional[str] = None
    username: Optional[str] = None
    force_update: bool = False

class UserInDB(User):
    pass