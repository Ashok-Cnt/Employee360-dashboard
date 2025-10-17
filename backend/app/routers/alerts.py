"""
Alert Rules API Router
Manages alert rules for desktop notifications
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import sys
from pathlib import Path
import os

# Add data-collector to path to import alert_engine
data_collector_path = Path(__file__).parent.parent.parent.parent / 'data-collector'
if str(data_collector_path) not in sys.path:
    sys.path.insert(0, str(data_collector_path))

try:
    from alert_engine import get_alert_engine, AlertRule
except ImportError as e:
    print(f"Warning: Could not import alert_engine: {e}")
    print(f"Looking in: {data_collector_path}")
    # Create stub functions for development
    class AlertRule:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def to_dict(self):
            return {}
    
    def get_alert_engine():
        return None

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

class AlertRuleCreate(BaseModel):
    name: str
    conditionType: str  # 'memory_usage', 'app_overrun', 'system_overrun'
    threshold: float
    durationMinutes: int
    enabled: bool = True
    targetApp: Optional[str] = None

class AlertRuleUpdate(BaseModel):
    name: Optional[str] = None
    conditionType: Optional[str] = None
    threshold: Optional[float] = None
    durationMinutes: Optional[int] = None
    enabled: Optional[bool] = None
    targetApp: Optional[str] = None

class AlertRuleResponse(BaseModel):
    ruleId: str
    name: str
    conditionType: str
    threshold: float
    durationMinutes: int
    enabled: bool
    targetApp: Optional[str] = None


@router.get("/rules", response_model=List[AlertRuleResponse])
async def get_alert_rules():
    """Get all alert rules"""
    try:
        alert_engine = get_alert_engine()
        rules = alert_engine.get_all_rules()
        return rules
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rules", response_model=AlertRuleResponse)
async def create_alert_rule(rule_data: AlertRuleCreate):
    """Create a new alert rule"""
    try:
        alert_engine = get_alert_engine()
        
        # Generate rule ID
        import uuid
        rule_id = str(uuid.uuid4())
        
        rule = AlertRule(
            rule_id=rule_id,
            name=rule_data.name,
            condition_type=rule_data.conditionType,
            threshold=rule_data.threshold,
            duration_minutes=rule_data.durationMinutes,
            enabled=rule_data.enabled,
            target_app=rule_data.targetApp
        )
        
        alert_engine.add_rule(rule)
        return rule.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/rules/{rule_id}", response_model=AlertRuleResponse)
async def update_alert_rule(rule_id: str, rule_data: AlertRuleUpdate):
    """Update an existing alert rule"""
    try:
        alert_engine = get_alert_engine()
        
        # Convert to dict and remove None values
        updates = {k: v for k, v in rule_data.dict().items() if v is not None}
        
        # Convert camelCase to snake_case for AlertRule attributes
        updates_snake = {}
        if 'conditionType' in updates:
            updates_snake['condition_type'] = updates['conditionType']
        if 'durationMinutes' in updates:
            updates_snake['duration_minutes'] = updates['durationMinutes']
        if 'targetApp' in updates:
            updates_snake['target_app'] = updates['targetApp']
        for key in ['name', 'threshold', 'enabled']:
            if key in updates:
                updates_snake[key] = updates[key]
        
        success = alert_engine.update_rule(rule_id, updates_snake)
        if not success:
            raise HTTPException(status_code=404, detail="Alert rule not found")
        
        # Return updated rule
        updated_rule = alert_engine.rules.get(rule_id)
        if updated_rule:
            return updated_rule.to_dict()
        else:
            raise HTTPException(status_code=404, detail="Alert rule not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/rules/{rule_id}")
async def delete_alert_rule(rule_id: str):
    """Delete an alert rule"""
    try:
        alert_engine = get_alert_engine()
        success = alert_engine.delete_rule(rule_id)
        if not success:
            raise HTTPException(status_code=404, detail="Alert rule not found")
        return {"message": "Alert rule deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rules/{rule_id}/toggle")
async def toggle_alert_rule(rule_id: str):
    """Toggle alert rule enabled/disabled"""
    try:
        alert_engine = get_alert_engine()
        rule = alert_engine.rules.get(rule_id)
        if not rule:
            raise HTTPException(status_code=404, detail="Alert rule not found")
        
        # Toggle enabled state
        success = alert_engine.update_rule(rule_id, {'enabled': not rule.enabled})
        if not success:
            raise HTTPException(status_code=404, detail="Alert rule not found")
        
        updated_rule = alert_engine.rules.get(rule_id)
        return updated_rule.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test")
async def test_notification():
    """Send a test desktop notification"""
    try:
        alert_engine = get_alert_engine()
        alert_engine.send_desktop_notification(
            title="Employee-360 Test Alert",
            message="This is a test notification. If you see this, desktop alerts are working!"
        )
        return {"message": "Test notification sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
