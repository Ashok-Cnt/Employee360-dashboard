# Desktop Alert System Documentation

## Overview
The Employee360 desktop alert system monitors application and system metrics in real-time and sends desktop notifications when configured conditions are met.

## Features

### Alert Condition Types

1. **Memory Usage**
   - Monitor memory consumption for specific applications or system-wide
   - Trigger alerts when memory exceeds threshold
   - Threshold: MB or percentage

2. **Application Overrun**
   - Detect when applications run for extended periods without being used
   - Identify idle applications consuming resources
   - Threshold: Running time in minutes

3. **System Overrun**
   - Monitor system-wide CPU usage
   - Alert on sustained high CPU usage
   - Threshold: CPU percentage

## Installation

### Install Dependencies

```powershell
# Install plyer for desktop notifications
cd data-collector
..\.venv\Scripts\pip.exe install plyer
```

### Verify Installation

```powershell
# Check if plyer is installed
..\.venv\Scripts\pip.exe list | Select-String plyer
```

## Configuration

### Default Rules

The system comes with three pre-configured rules:

1. **High Memory Usage Alert**
   - Condition: System memory > 80%
   - Duration: 5 minutes
   - Status: Enabled

2. **System Overrun Alert**
   - Condition: CPU usage > 90%
   - Duration: 10 minutes
   - Status: Enabled

3. **Application Running But Not Used**
   - Condition: App running > 2 hours without focus
   - Duration: 120 minutes
   - Status: Enabled

### Custom Rules

Create custom rules via the UI at: `http://localhost:3000/alert-rules`

#### Rule Parameters:

- **Name**: Descriptive name for the alert
- **Condition Type**: memory_usage, app_overrun, or system_overrun
- **Threshold**: Numeric value (MB, %, or minutes depending on type)
- **Duration**: How long condition must persist before alerting (minutes)
- **Target App**: (Optional) Specific application process name (e.g., 'chrome.exe')
- **Enabled**: Toggle to enable/disable the rule

## Usage

### Starting the Collector with Alerts

```powershell
# The alert engine is automatically integrated into the collector
cd data-collector
..\.venv\Scripts\python.exe collector_jsonl.py
```

### Managing Alert Rules via UI

1. Navigate to `http://localhost:3000/alert-rules`
2. Click "Add Alert Rule" to create a new rule
3. Fill in the form with your desired conditions
4. Click "Create" to save the rule
5. Toggle rules on/off with the switch
6. Edit or delete rules using the action buttons

### Testing Notifications

Use the "Test Notification" button in the UI to verify desktop notifications are working.

## Alert Rule Examples

### Example 1: Chrome Memory Alert
```json
{
  "name": "Chrome High Memory Usage",
  "conditionType": "memory_usage",
  "threshold": 2000,
  "durationMinutes": 5,
  "targetApp": "chrome.exe",
  "enabled": true
}
```
Alerts when Chrome uses more than 2GB RAM for 5+ minutes.

### Example 2: Visual Studio Code Idle Alert
```json
{
  "name": "VS Code Running Idle",
  "conditionType": "app_overrun",
  "threshold": 180,
  "durationMinutes": 60,
  "targetApp": "Code.exe",
  "enabled": true
}
```
Alerts when VS Code runs for 3+ hours but is only actively used for less than half that time.

### Example 3: System CPU Overload
```json
{
  "name": "System CPU Overload",
  "conditionType": "system_overrun",
  "threshold": 85,
  "durationMinutes": 15,
  "enabled": true
}
```
Alerts when system CPU exceeds 85% for 15+ minutes.

## API Endpoints

### Get All Alert Rules
```http
GET /api/alerts/rules
```

### Create Alert Rule
```http
POST /api/alerts/rules
Content-Type: application/json

{
  "name": "My Alert",
  "conditionType": "memory_usage",
  "threshold": 80,
  "durationMinutes": 5,
  "enabled": true,
  "targetApp": null
}
```

### Update Alert Rule
```http
PUT /api/alerts/rules/{ruleId}
Content-Type: application/json

{
  "name": "Updated Alert",
  "threshold": 90
}
```

### Delete Alert Rule
```http
DELETE /api/alerts/rules/{ruleId}
```

### Toggle Alert Rule
```http
POST /api/alerts/rules/{ruleId}/toggle
```

### Test Notification
```http
POST /api/alerts/test
```

## File Structure

```
data-collector/
├── alert_engine.py          # Core alert engine logic
├── alert_rules.json         # Saved alert rules (auto-generated)
└── collector_jsonl.py       # Main collector (integrated with alerts)

backend/
└── app/
    └── routers/
        └── alerts.py        # Alert management API

frontend/
└── src/
    └── pages/
        └── AlertRules.js    # Alert management UI
```

## Alert Cooldown

To prevent notification spam, alerts have a 5-minute cooldown period. After an alert is triggered, the same alert won't fire again for 5 minutes.

## Notification Behavior

- **Title**: Rule name
- **Message**: Detailed condition information
- **Duration**: 10 seconds on screen
- **Sound**: System notification sound (if enabled in OS)

## Troubleshooting

### Notifications Not Appearing

1. **Check plyer installation**:
   ```powershell
   ..\.venv\Scripts\pip.exe list | Select-String plyer
   ```

2. **Reinstall plyer**:
   ```powershell
   ..\.venv\Scripts\pip.exe install --upgrade plyer
   ```

3. **Check Windows notification settings**:
   - Settings > System > Notifications
   - Ensure notifications are enabled

4. **Test notification**:
   - Use the "Test Notification" button in the UI

### Rules Not Triggering

1. Check rule is enabled in UI
2. Verify threshold values are appropriate
3. Check duration settings (may need to wait for duration period)
4. Review collector logs for alert messages

### Performance Impact

The alert engine adds minimal overhead:
- Checks run during normal snapshot collection (every 60 seconds)
- No additional CPU/memory usage when idle
- Alert state tracking is in-memory

## Best Practices

1. **Set Realistic Thresholds**: Start with conservative values and adjust based on your usage
2. **Use Appropriate Durations**: Longer durations prevent false positives
3. **Target Specific Apps**: Use targetApp for application-specific monitoring
4. **Test First**: Use the test notification feature before relying on alerts
5. **Regular Review**: Periodically review and adjust rules based on effectiveness

## Advanced Configuration

### Custom Alert Cooldown

Edit `alert_engine.py`:
```python
self.alert_cooldown = 300  # Change to desired seconds
```

### Custom Notification Duration

Edit `alert_engine.py`:
```python
notification.notify(
    title=title,
    message=message,
    app_name='Employee360 Monitor',
    timeout=10  # Change to desired seconds
)
```

## Integration with Other Systems

The alert system can be extended to:
- Send emails (add email notification in `alert_engine.py`)
- Log to external monitoring systems
- Trigger automated actions
- Send to Slack/Teams webhooks

## Security Considerations

- Alert rules are stored locally in `alert_rules.json`
- No sensitive data is transmitted
- Notifications are shown only on the local desktop
- API endpoints can be secured with authentication (add middleware)

## Future Enhancements

Potential improvements:
- Email notifications
- SMS alerts
- Slack/Teams integration
- Alert history and analytics
- ML-based anomaly detection
- Custom alert actions/scripts
