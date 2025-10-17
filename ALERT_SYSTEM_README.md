# 🔔 Desktop Alert System - Complete Implementation

## ✅ Implementation Complete!

The desktop alert system has been successfully implemented with all requested features:

### 🎯 Features Implemented

1. **Memory Usage Monitoring**
   - System-wide memory alerts
   - Per-application memory tracking
   - Configurable MB or % thresholds

2. **Application Overrun Detection**
   - Detects apps running but not used
   - Tracks focus time vs run time
   - Identifies resource-wasting applications

3. **System Overrun Monitoring**
   - CPU usage tracking
   - Sustained high usage alerts
   - System performance warnings

4. **User-Configurable Rules**
   - Web-based UI for rule management
   - Create, edit, delete, toggle rules
   - Target specific apps or system-wide
   - Adjustable thresholds and durations

5. **Desktop Notifications**
   - Native Windows notifications
   - Custom alert messages
   - 5-minute cooldown to prevent spam

---

## 🚀 Quick Start

### Option 1: Quick Start Script
```powershell
.\start-with-alerts.ps1
```

### Option 2: Manual Start
```powershell
# 1. Install dependencies
cd data-collector
..\.venv\Scripts\pip install plyer

# 2. Start backend
cd backend
..\.venv\Scripts\python -m uvicorn main:app --port 8001

# 3. Start frontend (new terminal)
cd frontend
npm start

# 4. Start collector with alerts (new terminal)
cd data-collector
..\.venv\Scripts\python collector_jsonl.py
```

---

## 📖 Usage Guide

### Access the Alert Rules UI
```
http://localhost:3000/alert-rules
```

### Create Your First Alert Rule

1. **Click "Add Alert Rule"**

2. **Fill in the form:**
   - **Name**: "Chrome High Memory"
   - **Condition Type**: "Memory Usage"
   - **Threshold**: 2000 (MB)
   - **Duration**: 5 (minutes)
   - **Target App**: "chrome.exe" (optional)
   - **Enabled**: ✓

3. **Click "Create"**

4. **Test it**: Click "Test Notification" button

---

## 📋 Pre-Configured Rules

The system comes with 3 default rules:

| Rule | Condition | Threshold | Duration | Status |
|------|-----------|-----------|----------|--------|
| High Memory Usage | System Memory | 80% | 5 min | ✅ Enabled |
| System Overrun | CPU Usage | 90% | 10 min | ✅ Enabled |
| App Running Idle | App Not Used | 120 min | 120 min | ✅ Enabled |

---

## 💡 Example Use Cases

### Use Case 1: Memory Leak Detection
**Problem**: Chrome tabs accumulate and consume too much RAM

**Solution**:
```javascript
{
  name: "Chrome Memory Leak Warning",
  conditionType: "memory_usage",
  threshold: 3000,  // 3GB
  durationMinutes: 10,
  targetApp: "chrome.exe"
}
```
**Result**: Get notified when Chrome exceeds 3GB for 10+ minutes

---

### Use Case 2: Forgotten Applications
**Problem**: Visual Studio left running overnight

**Solution**:
```javascript
{
  name: "VS Forgotten Alert",
  conditionType: "app_overrun",
  threshold: 480,  // 8 hours
  durationMinutes: 240,  // 4 hours idle
  targetApp: "devenv.exe"
}
```
**Result**: Alert when VS runs 8+ hours but idle for 4+ hours

---

### Use Case 3: System Performance
**Problem**: System becomes sluggish under load

**Solution**:
```javascript
{
  name: "System Under Heavy Load",
  conditionType: "system_overrun",
  threshold: 85,  // 85% CPU
  durationMinutes: 15
}
```
**Result**: Alert when CPU exceeds 85% for 15+ minutes

---

## 🔧 API Reference

### Get All Rules
```http
GET http://localhost:8001/api/alerts/rules
```

### Create Rule
```http
POST http://localhost:8001/api/alerts/rules
Content-Type: application/json

{
  "name": "My Custom Alert",
  "conditionType": "memory_usage",
  "threshold": 80,
  "durationMinutes": 5,
  "enabled": true,
  "targetApp": null
}
```

### Update Rule
```http
PUT http://localhost:8001/api/alerts/rules/{ruleId}
Content-Type: application/json

{
  "threshold": 90,
  "enabled": true
}
```

### Delete Rule
```http
DELETE http://localhost:8001/api/alerts/rules/{ruleId}
```

### Toggle Rule
```http
POST http://localhost:8001/api/alerts/rules/{ruleId}/toggle
```

### Test Notification
```http
POST http://localhost:8001/api/alerts/test
```

---

## 🎨 UI Screenshots

### Alert Rules Dashboard
- Card-based display of all rules
- Visual indicators for enabled/disabled status
- Quick toggle switches
- Edit and delete buttons
- Create new rule dialog

### Rule Configuration Dialog
- Rule name input
- Condition type dropdown (Memory/App/System)
- Threshold number input with units
- Duration slider
- Target app field (optional)
- Enabled/disabled toggle

---

## 📁 File Structure

```
Employee360-dashboard/
├── data-collector/
│   ├── alert_engine.py          # ⭐ Alert engine core
│   ├── alert_rules.json         # Auto-generated rules storage
│   ├── collector_jsonl.py       # Integrated with alerts
│   └── requirements.txt         # Added plyer dependency
│
├── backend/
│   ├── main.py                  # Registered alerts router
│   └── app/routers/
│       └── alerts.py            # ⭐ Alert management API
│
├── frontend/src/
│   ├── App.js                   # Added alert route
│   ├── components/
│   │   └── Sidebar.js           # Added alert menu item
│   └── pages/
│       └── AlertRules.js        # ⭐ Alert management UI
│
└── docs/
    ├── DESKTOP_ALERTS_GUIDE.md      # Full documentation
    ├── ALERT_SYSTEM_SUMMARY.md      # Implementation summary
    └── start-with-alerts.ps1        # Quick start script
```

---

## 🔍 How It Works

### Architecture Flow

```
┌──────────────────────────────────────────────────┐
│                 User Interface                   │
│         http://localhost:3000/alert-rules        │
│  - Create/Edit/Delete Rules                      │
│  - Toggle Enable/Disable                         │
│  - Test Notifications                            │
└─────────────────┬────────────────────────────────┘
                  │ REST API
┌─────────────────▼────────────────────────────────┐
│              Backend API                         │
│      /api/alerts/* endpoints                     │
│  - CRUD operations on rules                      │
│  - Persists to alert_rules.json                  │
└─────────────────┬────────────────────────────────┘
                  │ File I/O
┌─────────────────▼────────────────────────────────┐
│           alert_rules.json                       │
│  - Stores all alert rules                        │
│  - Loaded by alert engine                        │
└─────────────────┬────────────────────────────────┘
                  │ Load on startup
┌─────────────────▼────────────────────────────────┐
│            Alert Engine                          │
│  - Checks conditions every 60 seconds            │
│  - Monitors: Memory, CPU, App Usage              │
│  - Tracks alert state & cooldowns                │
└─────────────────┬────────────────────────────────┘
                  │ Integrated
┌─────────────────▼────────────────────────────────┐
│          Data Collector                          │
│  - Runs continuously                             │
│  - Collects system & app metrics                 │
│  - Triggers alert checks                         │
└─────────────────┬────────────────────────────────┘
                  │ On condition met
┌─────────────────▼────────────────────────────────┐
│      Windows Desktop Notification                │
│  - Shows alert title & message                   │
│  - 10 second display duration                    │
│  - System notification sound                     │
└──────────────────────────────────────────────────┘
```

---

## 🛠️ Troubleshooting

### Notifications Not Showing

**Problem**: Desktop notifications don't appear

**Solutions**:
1. **Check plyer installation**:
   ```powershell
   cd data-collector
   ..\.venv\Scripts\pip list | Select-String plyer
   ```
   Should show: `plyer 2.1.0`

2. **Reinstall plyer**:
   ```powershell
   ..\.venv\Scripts\pip install --upgrade plyer
   ```

3. **Check Windows notification settings**:
   - Windows Settings → System → Notifications
   - Ensure "Get notifications from apps and other senders" is ON

4. **Test notification**:
   - Go to http://localhost:3000/alert-rules
   - Click "Test Notification"
   - Should see Windows toast notification

### Rules Not Triggering

**Problem**: Alerts don't fire when conditions are met

**Solutions**:
1. **Check rule is enabled**: Toggle should be green/ON
2. **Verify threshold values**: May be too high
3. **Check duration**: Must wait for duration period
4. **Review logs**: Check collector output for alert messages
5. **Verify cooldown**: 5-minute cooldown between same alerts

### Backend API Errors

**Problem**: Can't create/update rules

**Solutions**:
1. **Check backend is running**: http://localhost:8001/docs
2. **Verify CORS**: Backend should allow frontend origin
3. **Check network tab**: Look for API errors in browser devtools

---

## 📊 Benefits

✅ **Proactive Monitoring** - Catch issues before they become critical  
✅ **Resource Management** - Identify memory/CPU hogs  
✅ **Productivity** - Find forgotten apps wasting resources  
✅ **Customizable** - Create rules for your workflow  
✅ **Non-Intrusive** - Smart cooldown prevents spam  
✅ **Easy Setup** - Works out of the box with defaults  
✅ **Flexible** - System-wide or per-application monitoring  

---

## 🎓 Advanced Configuration

### Customize Cooldown Period

Edit `data-collector/alert_engine.py`:
```python
self.alert_cooldown = 300  # Change to desired seconds (default: 300 = 5 min)
```

### Customize Notification Duration

Edit `data-collector/alert_engine.py`:
```python
notification.notify(
    title=title,
    message=message,
    app_name='Employee360 Monitor',
    timeout=10  # Change to desired seconds (default: 10)
)
```

### Add Email Notifications

Extend `alert_engine.py`:
```python
import smtplib
from email.message import EmailMessage

def send_email_notification(self, title, message):
    msg = EmailMessage()
    msg.set_content(message)
    msg['Subject'] = title
    msg['From'] = 'alerts@employee360.com'
    msg['To'] = 'your-email@example.com'
    
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login('your-email', 'your-password')
        server.send_message(msg)
```

---

## 📚 Documentation

- **Full Guide**: `DESKTOP_ALERTS_GUIDE.md`
- **Summary**: `ALERT_SYSTEM_SUMMARY.md`
- **API Docs**: http://localhost:8001/docs

---

## ✨ Next Steps

1. **Start the system**: Run `.\start-with-alerts.ps1`
2. **Test notifications**: Click "Test Notification" in UI
3. **Create your first rule**: Add a rule for your most-used app
4. **Monitor for a day**: See which alerts are most useful
5. **Refine thresholds**: Adjust based on your usage patterns

---

## 🎉 You're All Set!

The desktop alert system is fully functional and ready to help you:
- Monitor system resources
- Track application usage
- Get proactive notifications
- Prevent performance issues
- Improve productivity

**Enjoy your new alert system!** 🚀

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the logs in the data collector terminal
3. Verify all services are running
4. Test with default rules first

Happy monitoring! 🎯
