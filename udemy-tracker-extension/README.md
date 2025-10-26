# Udemy Tracker Extension - Installation Guide

## 🚀 Quick Start

### Step 1: Load Extension in Chrome

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - OR click the puzzle icon → "Manage Extensions"

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to: `C:\Arun\Learning\MCP\Employee360-dashboard\udemy-tracker-extension`
   - Click "Select Folder"

4. **Verify Installation**
   - You should see "Udemy Progress Tracker" in your extensions list
   - Pin it to toolbar for easy access (click pin icon)

### Step 2: Start the Backend Server

The Udemy tracker is now integrated with the main Employee360 backend server.

Open a new terminal and run:

```bash
cd C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard
start-backend-json.bat
```

This starts the Express server on `http://localhost:8001` which includes the Udemy tracker endpoints.

### Step 3: Test on Udemy

1. **Navigate to a Udemy Course**
   - Go to any course page on `udemy.com/course/*`
   - Example: https://www.udemy.com/course/java-the-complete-java-developer-course/

2. **Verify Extension is Working**
   - Click the extension icon in your toolbar
   - You should see "Tracking Active" with green dot
   - Course name and statistics will appear

3. **Check Data Capture**
   - Data is automatically captured every 30 seconds
   - Manual capture: Click "📸 Capture Now" in extension popup
   - Check terminal for confirmation messages

### Step 4: View Captured Data

Data is stored in:
```
C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard\backend-express\data\udemy_activity\
udemy_enhanced_2025-10-26_GBS05262.jsonl
```

---

## 🎯 Features

### Automatic Tracking
- ✅ Captures data every 30 seconds
- ✅ Monitors DOM changes (lesson completion, navigation)
- ✅ Detects video completion events
- ✅ Auto-retry on network errors

### Data Captured
- **Course Structure:**
  - All sections with names
  - All lessons per section with titles
  - Lesson types (video, quiz, article, coding exercise)
  - Lesson durations

- **Progress Tracking:**
  - Completed lessons (checkmarks)
  - Current lesson being watched
  - Video playback position
  - Overall course progress percentage

- **Metadata:**
  - Instructor name
  - Course rating
  - Course URL and ID
  - Timestamps

### Extension Popup
- **Status Indicator:** Green dot = active, Red dot = inactive
- **Course Info:** Current course name and statistics
- **Stats Display:** Sections, Lessons, Completed count, Progress %
- **Manual Capture:** Force immediate data capture
- **Cached Data:** View offline cached entries

---

## 📊 Data Format

### Enhanced JSONL Structure

```json
{
  "timestamp": "2025-10-21T14:30:00.000Z",
  "type": "udemy_extension",
  "course": {
    "id": "java-the-complete-java-developer-course",
    "name": "Java Masterclass 2025: 130+ Hours of Expert Lessons",
    "url": "https://www.udemy.com/course/java-the-complete-java-developer-course/",
    "progress": {
      "percentComplete": 25,
      "completedLectures": 45,
      "totalLectures": 180,
      "rawText": "25% complete"
    },
    "metadata": {
      "instructor": "Tim Buchalka",
      "rating": "4.6 (50,000 ratings)",
      "lastUpdated": "2025-10-21T14:30:00.000Z"
    }
  },
  "sections": [
    {
      "sectionIndex": 1,
      "sectionTitle": "Introduction to Java Programming",
      "totalLessons": 12,
      "completedLessons": 8,
      "lessons": [
        {
          "lessonIndex": 1,
          "lessonTitle": "Welcome to the Course",
          "duration": "5:30",
          "isCompleted": true,
          "type": "video",
          "url": "https://www.udemy.com/course/java-the-complete-java-developer-course/learn/lecture/12345"
        },
        {
          "lessonIndex": 2,
          "lessonTitle": "Setting Up Your Development Environment",
          "duration": "12:45",
          "isCompleted": true,
          "type": "video",
          "url": "https://www.udemy.com/course/java-the-complete-java-developer-course/learn/lecture/12346"
        }
      ]
    }
  ],
  "currentLesson": {
    "lessonTitle": "Variables and Data Types",
    "videoProgress": {
      "currentTime": 145,
      "duration": 720,
      "percentComplete": 20.14,
      "isPlaying": true
    },
    "timestamp": "2025-10-21T14:30:00.000Z"
  },
  "stats": {
    "totalSections": 15,
    "totalLessons": 180,
    "completedLessons": 45
  },
  "captureMethod": "browser_extension"
}
```

---

## 🔧 Configuration

### Extension Settings

Edit `content-script.js` to modify:

```javascript
const CONFIG = {
  collectorEndpoint: 'http://localhost:8001/api/udemy-tracker',
  updateInterval: 30000,  // 30 seconds (adjust as needed)
  debug: true,            // Set to false to reduce console logs
  retryAttempts: 3,       // Number of retry attempts
  retryDelay: 2000        // Delay between retries (ms)
};
```

### Backend Server

The Udemy tracker is now integrated with the main Employee360 backend (port 8001).
Data is stored in `backend-express\data\udemy_activity\` directory.

---

## 🐛 Troubleshooting

### Extension Not Capturing Data

1. **Check Extension Status**
   - Click extension icon
   - Verify "Tracking Active" status
   - Check last capture time

2. **Check Console Logs**
   - Right-click on page → Inspect
   - Go to Console tab
   - Look for "🎓 Udemy Progress Tracker started" message
   - Check for any error messages

3. **Verify on Course Page**
   - Must be on `udemy.com/course/*` URL
   - Not on course homepage or search results

### Collector Not Receiving Data

1. **Check Backend Server is Running**
   - Terminal should show: "Employee360 Express server running"
   - Look for: "Udemy Tracker: Data stored in..."
   - No error messages

2. **Test Health Endpoint**
   - Open: http://localhost:8001/api/udemy-tracker/health
   - Should return JSON with status "healthy"

3. **Check CORS**
   - Extension needs CORS enabled
   - Backend server has CORS enabled for all origins

4. **Firewall Issues**
   - Allow Node.js through Windows Firewall
   - Port 8001 must be accessible

### Data Not Showing in Files

1. **Check File Location**
   ```
   C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard\backend-express\data\udemy_activity\
   udemy_enhanced_YYYY-MM-DD_USERNAME.jsonl
   ```

2. **Check Permissions**
   - Ensure Node.js has write access to `data\udemy_activity` folder

3. **Check File Content**
   - Open JSONL file in text editor
   - Each line should be valid JSON

### Extension Badge Shows "!"

- Red badge with "!" = Network error
- Extension is caching data locally
- Check if Python collector is running
- Verify endpoint URL in `content-script.js`

---

## 📈 Viewing Stats

### Via Extension Popup
- Click extension icon
- View real-time statistics
- See current course info

### Via API Endpoint
```bash
curl http://localhost:8001/api/udemy-tracker/stats
```

Returns:
```json
{
  "entries": 3,
  "courses": [
    {
      "name": "Java Masterclass 2025",
      "lastUpdate": "2025-10-26T14:30:00.000Z",
      "stats": {
        "totalSections": 15,
        "totalLessons": 180,
        "completedLessons": 45
      }
    }
  ],
  "file": "udemy_enhanced_2025-10-26_GBS05262.jsonl"
}
```

### Via Log Files
Check terminal output for real-time capture logs:
```
[2025-10-26 14:30:00] Udemy: Java Masterclass 2025 - 15 sections, 180 lessons, 45 completed
```

---

## 🔄 Integration with Backend

The enhanced data will be automatically integrated with your existing Learning Progress dashboard once you implement the backend parser (see `BROWSER_EXTENSION_SOLUTION.md` Phase 3).

---

## 🎨 Customization

### Change Icon
Replace files in `udemy-tracker-extension/icons/`:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

### Modify Popup UI
Edit `popup.html` and `popup.js` to customize the extension popup interface.

### Adjust Capture Frequency
In `content-script.js`:
```javascript
const CONFIG = {
  updateInterval: 60000  // Change to 60 seconds (1 minute)
};
```

---

## 📝 Notes

- Extension only works on `*.udemy.com/course/*` pages
- Requires Employee360 backend server to be running on port 8001
- Data is stored locally in `backend-express\data\udemy_activity\`
- Integrated with Employee360 Dashboard backend
- No external services or tracking
- Privacy-focused: all data stays on your machine

---

## 🆘 Support

If you encounter issues:

1. Check Chrome DevTools Console for errors
2. Verify backend server terminal for error messages
3. Test health endpoint: http://localhost:8001/api/udemy-tracker/health
4. Review captured data in JSONL files
5. Enable debug mode in CONFIG

---

## ✅ Next Steps

After verifying the extension works:

1. ✅ Implement backend integration (see Phase 3 in BROWSER_EXTENSION_SOLUTION.md)
2. ✅ Create frontend Section View component (see Phase 4)
3. ✅ Add progress visualization charts
4. ✅ Set up automated reports

Enjoy detailed Udemy progress tracking! 🎓
