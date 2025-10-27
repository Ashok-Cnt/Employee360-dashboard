import logging
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any
import psutil
from collections import defaultdict

# Windows notification support
try:
    from plyer import notification
    NOTIFICATIONS_AVAILABLE = True
except ImportError:
    NOTIFICATIONS_AVAILABLE = False
    logging.warning("plyer not installed. Desktop notifications disabled. Install with: pip install plyer")

logger = logging.getLogger(__name__)

class AlertRule:
    """Represents a single alert rule"""
    
    def __init__(self, rule_id: str, name: str, condition_type: str, 
                 threshold: float, duration_minutes: int, enabled: bool = True,
                 target_app: str = None):
        self.rule_id = rule_id
        self.name = name
        self.condition_type = condition_type  # 'memory_usage', 'app_overrun', 'system_overrun'
        self.threshold = threshold
        self.duration_minutes = duration_minutes
        self.enabled = enabled
        self.target_app = target_app  # Specific app name, or None for system-wide
        
    def to_dict(self):
        return {
            'ruleId': self.rule_id,
            'name': self.name,
            'conditionType': self.condition_type,
            'threshold': self.threshold,
            'durationMinutes': self.duration_minutes,
            'enabled': self.enabled,
            'targetApp': self.target_app
        }
    
    @classmethod
    def from_dict(cls, data):
        return cls(
            rule_id=data.get('ruleId'),
            name=data.get('name'),
            condition_type=data.get('conditionType'),
            threshold=data.get('threshold'),
            duration_minutes=data.get('durationMinutes'),
            enabled=data.get('enabled', True),
            target_app=data.get('targetApp')
        )


class AlertEngine:
    """Monitors system and application metrics and triggers alerts based on rules"""
    
    def __init__(self, rules_file: Path = None):
        self.rules_file = rules_file or Path(__file__).parent / 'alert_rules.json'
        self.notifications_file = Path(__file__).parent / 'notification_history.json'
        self.rules: Dict[str, AlertRule] = {}
        self.alert_state = defaultdict(lambda: {
            'start_time': None,
            'last_alert_time': None,
            'alert_count': 0
        })
        self.alert_cooldown = 300  # 5 minutes cooldown between same alerts
        self.last_rules_check = None
        self.rules_check_interval = 60  # Check for rule changes every 60 seconds
        self.max_notifications = 100  # Keep last 100 notifications
        
        # Load rules
        self.load_rules()
        
    def load_rules(self):
        """Load alert rules from file"""
        if self.rules_file.exists():
            try:
                with open(self.rules_file, 'r', encoding='utf-8') as f:
                    rules_data = json.load(f)
                    self.rules.clear()  # Clear existing rules before loading
                    for rule_data in rules_data:
                        rule = AlertRule.from_dict(rule_data)
                        self.rules[rule.rule_id] = rule
                logger.info(f"Loaded {len(self.rules)} alert rules")
                self.last_rules_check = datetime.now()
            except Exception as e:
                logger.error(f"Error loading alert rules: {e}")
        else:
            # Create default rules
            self.create_default_rules()
    
    def reload_rules_if_needed(self):
        """Reload rules if enough time has passed"""
        if not self.last_rules_check or \
           (datetime.now() - self.last_rules_check).total_seconds() >= self.rules_check_interval:
            logger.info("Reloading alert rules...")
            self.load_rules()
            
    def save_rules(self):
        """Save alert rules to file"""
        try:
            rules_data = [rule.to_dict() for rule in self.rules.values()]
            with open(self.rules_file, 'w', encoding='utf-8') as f:
                json.dump(rules_data, f, indent=2)
            logger.info(f"Saved {len(self.rules)} alert rules")
        except Exception as e:
            logger.error(f"Error saving alert rules: {e}")
    
    def save_notification(self, rule_name: str, message: str, rule_id: str = None):
        """Save notification to history file"""
        try:
            # Load existing notifications
            notifications = []
            if self.notifications_file.exists():
                with open(self.notifications_file, 'r', encoding='utf-8') as f:
                    notifications = json.load(f)
            
            # Add new notification
            notification_data = {
                'id': f"{int(datetime.now().timestamp() * 1000)}",
                'ruleId': rule_id,
                'ruleName': rule_name,
                'message': message,
                'timestamp': datetime.now().isoformat(),
                'read': False
            }
            notifications.insert(0, notification_data)
            
            # Keep only last max_notifications
            notifications = notifications[:self.max_notifications]
            
            # Save back to file
            with open(self.notifications_file, 'w', encoding='utf-8') as f:
                json.dump(notifications, f, indent=2)
            
            logger.debug(f"Saved notification: {rule_name}")
        except Exception as e:
            logger.error(f"Error saving notification: {e}")
    
    def get_notifications(self, unread_only: bool = False, limit: int = None):
        """Get notification history"""
        try:
            if self.notifications_file.exists():
                with open(self.notifications_file, 'r', encoding='utf-8') as f:
                    notifications = json.load(f)
                    
                if unread_only:
                    notifications = [n for n in notifications if not n.get('read', False)]
                
                if limit:
                    notifications = notifications[:limit]
                    
                return notifications
        except Exception as e:
            logger.error(f"Error loading notifications: {e}")
        
        return []
    
    def mark_notification_read(self, notification_id: str):
        """Mark a notification as read"""
        try:
            if self.notifications_file.exists():
                with open(self.notifications_file, 'r', encoding='utf-8') as f:
                    notifications = json.load(f)
                
                # Find and mark as read
                for notif in notifications:
                    if notif['id'] == notification_id:
                        notif['read'] = True
                        break
                
                # Save back
                with open(self.notifications_file, 'w', encoding='utf-8') as f:
                    json.dump(notifications, f, indent=2)
                    
                return True
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
        
        return False
    
    def mark_all_notifications_read(self):
        """Mark all notifications as read"""
        try:
            if self.notifications_file.exists():
                with open(self.notifications_file, 'r', encoding='utf-8') as f:
                    notifications = json.load(f)
                
                # Mark all as read
                for notif in notifications:
                    notif['read'] = True
                
                # Save back
                with open(self.notifications_file, 'w', encoding='utf-8') as f:
                    json.dump(notifications, f, indent=2)
                    
                return True
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {e}")
        
        return False
            
    def create_default_rules(self):
        """Create default alert rules"""
        default_rules = [
            AlertRule(
                rule_id='memory_high',
                name='High Memory Usage Alert',
                condition_type='memory_usage',
                threshold=80.0,  # 80% memory usage
                duration_minutes=5,
                enabled=True
            ),
            AlertRule(
                rule_id='system_overrun',
                name='System Overrun Alert',
                condition_type='system_overrun',
                threshold=90.0,  # 90% CPU usage
                duration_minutes=10,
                enabled=True
            ),
            AlertRule(
                rule_id='app_idle_warning',
                name='Application Running But Not Used',
                condition_type='app_overrun',
                threshold=120,  # Running for 2+ hours without focus
                duration_minutes=120,
                enabled=True
            )
        ]
        
        for rule in default_rules:
            self.rules[rule.rule_id] = rule
        self.save_rules()
        
    def add_rule(self, rule: AlertRule):
        """Add a new alert rule"""
        self.rules[rule.rule_id] = rule
        self.save_rules()
        
    def update_rule(self, rule_id: str, updates: Dict[str, Any]):
        """Update an existing alert rule"""
        if rule_id in self.rules:
            rule = self.rules[rule_id]
            for key, value in updates.items():
                if hasattr(rule, key):
                    setattr(rule, key, value)
            self.save_rules()
            return True
        return False
        
    def delete_rule(self, rule_id: str):
        """Delete an alert rule"""
        if rule_id in self.rules:
            del self.rules[rule_id]
            self.save_rules()
            return True
        return False
        
    def get_all_rules(self) -> List[Dict]:
        """Get all alert rules"""
        return [rule.to_dict() for rule in self.rules.values()]
        
    def check_memory_usage(self, rule: AlertRule, app_tracking: Dict) -> bool:
        """Check if memory usage exceeds threshold"""
        if rule.target_app:
            # Check specific app memory
            if rule.target_app in app_tracking:
                app_data = app_tracking[rule.target_app]
                # Note: We need current memory from snapshot, not tracked total
                return False  # Will be checked in check_alerts with current snapshot
        else:
            # Check system memory
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            state_key = f"{rule.rule_id}_system"
            state = self.alert_state[state_key]
            
            if memory_percent >= rule.threshold:
                if state['start_time'] is None:
                    state['start_time'] = datetime.now()
                
                duration = (datetime.now() - state['start_time']).total_seconds() / 60
                if duration >= rule.duration_minutes:
                    return True
            else:
                state['start_time'] = None
                
        return False
        
    def check_system_overrun(self, rule: AlertRule) -> bool:
        """Check if system CPU usage exceeds threshold"""
        cpu_percent = psutil.cpu_percent(interval=1)
        
        state_key = f"{rule.rule_id}_system"
        state = self.alert_state[state_key]
        
        if cpu_percent >= rule.threshold:
            if state['start_time'] is None:
                state['start_time'] = datetime.now()
            
            duration = (datetime.now() - state['start_time']).total_seconds() / 60
            if duration >= rule.duration_minutes:
                return True
        else:
            state['start_time'] = None
            
        return False
        
    def check_app_overrun(self, rule: AlertRule, app_tracking: Dict) -> bool:
        """Check if app is running but not being used"""
        for app_name, app_data in app_tracking.items():
            # Skip if rule targets specific app and this isn't it
            if rule.target_app and rule.target_app != app_name:
                continue
                
            # Check if app has been running but not focused
            run_minutes = app_data.get('total_run_seconds', 0) / 60
            focus_minutes = app_data.get('total_focus_seconds', 0) / 60
            
            if run_minutes >= rule.threshold:
                # App has been running for threshold duration
                idle_minutes = run_minutes - focus_minutes
                
                # If app has been idle for more than half its run time
                if idle_minutes > run_minutes * 0.5 and idle_minutes >= rule.duration_minutes:
                    state_key = f"{rule.rule_id}_{app_name}"
                    state = self.alert_state[state_key]
                    
                    # Check cooldown
                    if state['last_alert_time']:
                        time_since_alert = (datetime.now() - state['last_alert_time']).total_seconds()
                        if time_since_alert < self.alert_cooldown:
                            continue
                    
                    return True
                    
        return False
        
    def send_desktop_notification(self, title: str, message: str, rule_id: str = None):
        """Send desktop notification and save to history"""
        # Save to history first
        self.save_notification(title, message, rule_id)
        
        if not NOTIFICATIONS_AVAILABLE:
            logger.warning(f"Notification not sent (plyer not installed): {title} - {message}")
            return
            
        try:
            notification.notify(
                title=title,
                message=message,
                app_name='Employee-360',
                timeout=10  # Notification stays for 10 seconds
            )
            logger.info(f"Desktop notification sent: {title}")
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
            
    def check_alerts(self, app_tracking: Dict, current_snapshot: Dict = None):
        """Check all alert rules and trigger notifications"""
        # Reload rules if needed (every 60 seconds)
        self.reload_rules_if_needed()
        
        for rule in self.rules.values():
            if not rule.enabled:
                continue
                
            triggered = False
            alert_message = ""
            
            if rule.condition_type == 'memory_usage':
                if current_snapshot:
                    # Check app memory from current snapshot
                    for app in current_snapshot.get('apps', []):
                        app_name = app.get('name', '')
                        
                        # Skip if rule targets specific app and this isn't it
                        if rule.target_app and rule.target_app != app_name:
                            continue
                        
                        # Skip background_apps
                        if app_name == 'background_apps':
                            continue
                        
                        memory_mb = app.get('memoryUsageMB', 0)
                        if memory_mb >= rule.threshold:
                            state_key = f"{rule.rule_id}_{app_name}"
                            state = self.alert_state[state_key]
                            
                            # Check cooldown
                            if state['last_alert_time']:
                                time_since_alert = (datetime.now() - state['last_alert_time']).total_seconds()
                                if time_since_alert < self.alert_cooldown:
                                    continue
                            
                            triggered = True
                            app_title = app.get('title', app_name)
                            alert_message = f"'{app_title}' is using {memory_mb:.0f} MB of memory (threshold: {rule.threshold:.0f} MB)"
                            state['last_alert_time'] = datetime.now()
                            state['alert_count'] += 1
                            
                            # Send notification for this app
                            self.send_desktop_notification(
                                title=rule.name,
                                message=alert_message,
                                rule_id=rule.rule_id
                            )
                            logger.warning(f"Alert triggered: {rule.name} - {alert_message}")
                else:
                    # No snapshot, check system memory as fallback
                    triggered = self.check_memory_usage(rule, app_tracking)
                    if triggered:
                        memory = psutil.virtual_memory()
                        alert_message = f"System memory usage is {memory.percent:.1f}% (threshold: {rule.threshold:.0f}%)"
                        self.send_desktop_notification(
                            title=rule.name,
                            message=alert_message,
                            rule_id=rule.rule_id
                        )
                        logger.warning(f"Alert triggered: {rule.name} - {alert_message}")
                        
            elif rule.condition_type == 'system_overrun':
                triggered = self.check_system_overrun(rule)
                if triggered:
                    cpu_percent = psutil.cpu_percent(interval=0)
                    alert_message = f"System CPU usage is {cpu_percent:.1f}% for {rule.duration_minutes} minutes (threshold: {rule.threshold:.0f}%)"
                    self.send_desktop_notification(
                        title=rule.name,
                        message=alert_message,
                        rule_id=rule.rule_id
                    )
                    logger.warning(f"Alert triggered: {rule.name} - {alert_message}")
                    
            elif rule.condition_type == 'app_overrun':
                # Find apps that match the condition
                for app_name, app_data in app_tracking.items():
                    if rule.target_app and rule.target_app != app_name:
                        continue
                        
                    run_minutes = app_data.get('total_run_seconds', 0) / 60
                    focus_minutes = app_data.get('total_focus_seconds', 0) / 60
                    
                    if run_minutes >= rule.threshold:
                        idle_minutes = run_minutes - focus_minutes
                        if idle_minutes > run_minutes * 0.5 and idle_minutes >= rule.duration_minutes:
                            state_key = f"{rule.rule_id}_{app_name}"
                            state = self.alert_state[state_key]
                            
                            # Check cooldown
                            if state['last_alert_time']:
                                time_since_alert = (datetime.now() - state['last_alert_time']).total_seconds()
                                if time_since_alert < self.alert_cooldown:
                                    continue
                            
                            triggered = True
                            friendly_name = app_data.get('title', app_name)
                            alert_message = f"'{friendly_name}' has been running for {run_minutes:.0f} minutes but only used for {focus_minutes:.0f} minutes"
                            state['last_alert_time'] = datetime.now()
                            state['alert_count'] += 1
                            
                            self.send_desktop_notification(
                                title=rule.name,
                                message=alert_message,
                                rule_id=rule.rule_id
                            )
                            logger.warning(f"Alert triggered: {rule.name} - {alert_message}")


# Singleton instance
_alert_engine_instance = None

def get_alert_engine() -> AlertEngine:
    """Get the global AlertEngine instance"""
    global _alert_engine_instance
    if _alert_engine_instance is None:
        _alert_engine_instance = AlertEngine()
    return _alert_engine_instance
