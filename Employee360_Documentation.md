# Employee 360 Dashboard Documentation

## Overview

Employee 360 Dashboard is a comprehensive web application designed to visualize and analyze user activity and metrics. The dashboard provides insights into:

- Working application details (primary focus)
- Learning activities
- User health metrics

The system collects detailed activity data at high frequency (per second or few seconds) and stores it locally in JSONL format. Periodically, aggregated data will be migrated to an Oracle SQL Server for long-term storage and advanced querying.

## Features

- Search and filter user activity by:
  - Time range
  - Application
  - Project
- Visualize working patterns, application usage, and productivity metrics
- Support for health and learning data integration

## Data Flow

1. **Local Data Collection**:  
   Activity data is recorded in JSONL files (e.g., `activity_2025-10-17_GBS05262.jsonl`) at high frequency to avoid continuous database writes.

2. **Aggregation & Migration**:  
   Aggregated data will be periodically moved to an Oracle SQL database for efficient querying and reporting.

3. **Dashboard UI**:  
   Users can search, filter, and visualize data by time, application, and project.

## JSONL Data Format

Each line in the JSONL file represents a snapshot of user activity, including fields such as:

- `timestamp`
- `user_id`
- `application_name`
- `project_name`
- `activity_type`
- `duration`
- Additional metrics (CPU, memory, etc.)

### Sample JSONL Entry

```json
{"timestamp": "2025-10-17T12:05:44.641052Z", "system": {"cpuUsage": 5.0, "memoryUsageMB": 25831.0, "batteryPercent": 56, "isCharging": true, "uptimeSec": 350539.0, "idleTimeSec": 0.0, "isIdle": false, "aggregates": {"overallMonitoringHours": 0.14, "productiveHours": 0.03, "communicationHours": 0.0, "idleHours": 0.0, "avgCPU": 6.6}}, "apps": [{"name": "ms-teams.exe", "title": "Microsoft Teams", "category": "Communication", "isFocused": false, "runningTimeSec": 480, "focusDurationSec": 0, "cpuUsage": 0, "memoryUsageMB": 692.8, "aggregates": {"totalRunHours": 0.13, "totalFocusHours": 0.0}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 0, "runSeconds": 180}, {"hour": "12:00", "focusSeconds": 0, "runSeconds": 300}], "windowTitles": [], "focusSwitches": []}, {"name": "chrome.exe", "title": "Google Chrome", "category": "Browsers", "isFocused": false, "runningTimeSec": 480, "focusDurationSec": 0, "cpuUsage": 0, "memoryUsageMB": 1111.6, "aggregates": {"totalRunHours": 0.13, "totalFocusHours": 0.0}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 0, "runSeconds": 180}, {"hour": "12:00", "focusSeconds": 0, "runSeconds": 300}], "windowTitles": [], "focusSwitches": []}, {"name": "msedge.exe", "title": "Microsoft Edge", "category": "Browsers", "isFocused": false, "runningTimeSec": 480, "focusDurationSec": 300, "cpuUsage": 0, "memoryUsageMB": 972.4, "aggregates": {"totalRunHours": 0.13, "totalFocusHours": 0.08}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 120, "runSeconds": 180}, {"hour": "12:00", "focusSeconds": 180, "runSeconds": 300}], "windowTitles": ["Employee360 and 2 more pages - Work - Microsoft\u200b Edge", "Employee360 and 2 more pages - Work - Microsoft\u200b Edge", "Employee360 and 2 more pages - Work - Microsoft\u200b Edge", "Employee360 and 2 more pages - Work - Microsoft\u200b Edge", "Employee360 and 2 more pages - Work - Microsoft\u200b Edge"], "focusSwitches": [{"from": "2025-10-17T11:58:25.680417", "to": "2025-10-17T12:04:34.385204", "window_title": "Employee360 and 2 more pages - Work - Microsoft\u200b Edge"}]}, {"name": "mtputty.exe", "title": "Mtputty", "category": "Productive", "isFocused": false, "runningTimeSec": 480, "focusDurationSec": 0, "cpuUsage": 0, "memoryUsageMB": 19.9, "aggregates": {"totalRunHours": 0.13, "totalFocusHours": 0.0}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 0, "runSeconds": 180}, {"hour": "12:00", "focusSeconds": 0, "runSeconds": 300}], "windowTitles": [], "focusSwitches": []}, {"name": "Code.exe", "title": "Visual Studio Code", "category": "Productive", "isFocused": false, "runningTimeSec": 480, "focusDurationSec": 0, "cpuUsage": 0, "memoryUsageMB": 3398.4, "aggregates": {"totalRunHours": 0.13, "totalFocusHours": 0.0}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 0, "runSeconds": 180}, {"hour": "12:00", "focusSeconds": 0, "runSeconds": 300}], "windowTitles": [], "focusSwitches": []}, {"name": "explorer.exe", "title": "Explorer", "category": "Uncategorized", "isFocused": false, "runningTimeSec": 480, "focusDurationSec": 0, "cpuUsage": 0, "memoryUsageMB": 1003.4, "aggregates": {"totalRunHours": 0.13, "totalFocusHours": 0.0}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 0, "runSeconds": 180}, {"hour": "12:00", "focusSeconds": 0, "runSeconds": 300}], "windowTitles": [], "focusSwitches": []}, {"name": "idea64.exe", "title": "Idea64", "category": "Productive", "isFocused": false, "runningTimeSec": 480, "focusDurationSec": 0, "cpuUsage": 0, "memoryUsageMB": 3647.1, "aggregates": {"totalRunHours": 0.13, "totalFocusHours": 0.0}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 0, "runSeconds": 180}, {"hour": "12:00", "focusSeconds": 0, "runSeconds": 300}], "windowTitles": [], "focusSwitches": []}, {"name": "WebViewHost.exe", "title": "Webviewhost", "category": "Uncategorized", "isFocused": false, "runningTimeSec": 480, "focusDurationSec": 0, "cpuUsage": 0, "memoryUsageMB": 97.3, "aggregates": {"totalRunHours": 0.13, "totalFocusHours": 0.0}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 0, "runSeconds": 180}, {"hour": "12:00", "focusSeconds": 0, "runSeconds": 300}], "windowTitles": [], "focusSwitches": []}, {"name": "OUTLOOK.EXE", "title": "Microsoft Outlook", "category": "Communication", "isFocused": false, "runningTimeSec": 480, "focusDurationSec": 0, "cpuUsage": 0, "memoryUsageMB": 456.0, "aggregates": {"totalRunHours": 0.13, "totalFocusHours": 0.0}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 0, "runSeconds": 180}, {"hour": "12:00", "focusSeconds": 0, "runSeconds": 300}], "windowTitles": [], "focusSwitches": []}, {"name": "Notepad.exe", "title": "Notepad", "category": "Uncategorized", "isFocused": false, "runningTimeSec": 480, "focusDurationSec": 60, "cpuUsage": 0, "memoryUsageMB": 114.0, "aggregates": {"totalRunHours": 0.13, "totalFocusHours": 0.02}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 60, "runSeconds": 180}, {"hour": "12:00", "focusSeconds": 0, "runSeconds": 300}], "windowTitles": ["*tail -f serverdBH.out |grep 'it.sel - Notepad"], "focusSwitches": [{"from": "2025-10-17T11:57:10.935709", "to": "2025-10-17T11:58:25.680417", "window_title": "*tail -f serverdBH.out |grep 'it.sel - Notepad"}]}, {"name": "SystemSettings.exe", "title": "Systemsettings", "category": "Uncategorized", "isFocused": false, "runningTimeSec": 480, "focusDurationSec": 0, "cpuUsage": 0, "memoryUsageMB": 3.4, "aggregates": {"totalRunHours": 0.13, "totalFocusHours": 0.0}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 0, "runSeconds": 180}, {"hour": "12:00", "focusSeconds": 0, "runSeconds": 300}], "windowTitles": [], "focusSwitches": []}, {"name": "Bruno.exe", "title": "Bruno", "category": "Productive", "isFocused": true, "runningTimeSec": 480, "focusDurationSec": 120, "cpuUsage": 0, "memoryUsageMB": 430.6, "aggregates": {"totalRunHours": 0.13, "totalFocusHours": 0.03}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 0, "runSeconds": 180}, {"hour": "12:00", "focusSeconds": 120, "runSeconds": 300}], "windowTitles": ["Bruno", "Bruno"], "focusSwitches": []}, {"name": "sqldeveloper64W.exe", "title": "Sqldeveloper64w", "category": "Productive", "isFocused": false, "runningTimeSec": 480, "focusDurationSec": 0, "cpuUsage": 0, "memoryUsageMB": 97.6, "aggregates": {"totalRunHours": 0.13, "totalFocusHours": 0.0}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 0, "runSeconds": 180}, {"hour": "12:00", "focusSeconds": 0, "runSeconds": 300}], "windowTitles": [], "focusSwitches": []}, {"name": "ONENOTE.EXE", "title": "Onenote", "category": "Uncategorized", "isFocused": false, "runningTimeSec": 480, "focusDurationSec": 0, "cpuUsage": 0, "memoryUsageMB": 265.0, "aggregates": {"totalRunHours": 0.13, "totalFocusHours": 0.0}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 0, "runSeconds": 180}, {"hour": "12:00", "focusSeconds": 0, "runSeconds": 300}], "windowTitles": [], "focusSwitches": []}, {"name": "background_apps", "title": "Other Background Apps (75 apps)", "category": "Background", "isFocused": false, "runningTimeSec": 6720, "focusDurationSec": 480, "cpuUsage": 916.9, "memoryUsageMB": 10391.8, "aggregates": {"totalRunHours": 1.87, "totalFocusHours": 0.13}, "hourlyStats": [{"hour": "11:00", "focusSeconds": 180, "runSeconds": 2520}, {"hour": "12:00", "focusSeconds": 300, "runSeconds": 4200}]}], "hourlySummary": [{"hour": "11:00", "productiveFocusSec": 0, "communicationFocusSec": 0, "idleSec": 0}, {"hour": "12:00", "productiveFocusSec": 120, "communicationFocusSec": 0, "idleSec": 0}]}
```

When migrating to Oracle SQL, consider the following base tables:

### 1. Users

| Column Name   | Data Type    | Description           |
|---------------|-------------|-----------------------|
| user_id       | VARCHAR2    | Unique user identifier|
| name          | VARCHAR2    | User's name           |
| department    | VARCHAR2    | Department/Team       |
| ...           | ...         | Additional fields     |

### 2. Applications

| Column Name       | Data Type    | Description                |
|-------------------|-------------|----------------------------|
| app_id            | VARCHAR2     | Unique application ID      |
| application_name  | VARCHAR2     | Name of the application    |
| category          | VARCHAR2     | App category (work, learn) |
| ...               | ...          | Additional fields          |

### 3. Projects

| Column Name   | Data Type    | Description           |
|---------------|-------------|-----------------------|
| project_id    | VARCHAR2    | Unique project ID     |
| project_name  | VARCHAR2    | Name of the project   |
| ...           | ...         | Additional fields     |

### 4. Activity

| Column Name       | Data Type    | Description                        |
|-------------------|-------------|------------------------------------|
| activity_id       | NUMBER       | Primary key                        |
| timestamp         | DATE         | Activity timestamp                 |
| user_id           | VARCHAR2     | Foreign key to Users               |
| app_id            | VARCHAR2     | Foreign key to Applications        |
| project_id        | VARCHAR2     | Foreign key to Projects            |
| activity_type     | VARCHAR2     | Type of activity                   |
| duration_seconds  | NUMBER       | Duration in seconds                |
| cpu_usage         | NUMBER       | CPU usage (optional)               |
| memory_usage      | NUMBER       | Memory usage (optional)            |
| ...               | ...          | Additional metrics                 |

### 5. Health Metrics (Optional)

| Column Name   | Data Type    | Description           |
|---------------|-------------|-----------------------|
| metric_id     | NUMBER       | Primary key           |
| user_id       | VARCHAR2     | Foreign key to Users  |
| timestamp     | DATE         | Metric timestamp      |
| metric_type   | VARCHAR2     | (e.g., steps, heart)  |
| value         | NUMBER       | Metric value          |

### 6. Learning Details (Optional)

| Column Name       | Data Type    | Description                        |
|-------------------|-------------|------------------------------------|
| learning_id       | NUMBER       | Primary key                        |
| user_id           | VARCHAR2     | Foreign key to Users               |
| timestamp         | DATE         | Learning timestamp                 |
| course_name       | VARCHAR2     | Name of the course                 |
| duration_minutes  | NUMBER       | Duration in minutes                |
| completion_status | VARCHAR2     | Status (e.g., completed, in-progress) |
| ...               | ...          | Additional fields                  |

- By time range: `timestamp BETWEEN :start AND :end`
- By application: `application_name = :app_name`
- By project: `project_name = :project_name`

## Future Considerations

- Implement ETL scripts to aggregate and migrate JSONL data to Oracle SQL
- Optimize indexes for fast search/filter
- Add role-based access for data privacy