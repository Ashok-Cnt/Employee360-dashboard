# Updated Content Script - Testing Guide

## Changes Made

### ✅ What Was Fixed:

1. **Section Detection**: Now captures ALL sections (expanded + collapsed)
   - Uses `h3.ud-accordion-panel-heading` to get section titles
   - Detects 18 sections instead of just 1

2. **Smart Lesson Extraction**: 
   - Only extracts lesson details if section is EXPANDED
   - For collapsed sections: captures section name only
   - Adds `isExpanded: true/false` flag to each section

3. **Clean Section Titles**:
   - Removes extra info like "4 lectures • 15min"
   - Extracts proper section number from "Section X: Title" format

4. **Accurate Section Numbering**:
   - Uses actual section numbers from Udemy (1-18)
   - Not sequential index (0-17)

---

## Expected JSON Structure

### For COLLAPSED sections:
```json
{
  "sectionIndex": 1,
  "sectionTitle": "Kafka Introduction",
  "totalLessons": 0,
  "completedLessons": 0,
  "lessons": [],
  "isExpanded": false
}
```

### For EXPANDED sections:
```json
{
  "sectionIndex": 1,
  "sectionTitle": "Kafka Introduction",
  "totalLessons": 4,
  "completedLessons": 1,
  "lessons": [
    {
      "lessonIndex": 1,
      "lessonTitle": "1. Course Introduction",
      "duration": "3:45",
      "isCompleted": true,
      "type": "video",
      "url": "https://..."
    }
  ],
  "isExpanded": true
}
```

---

## How to Test

### Step 1: Reload Extension
1. Go to `chrome://extensions/`
2. Find "Udemy Progress Tracker"
3. Click the **↻ reload** button

### Step 2: Test on Udemy
1. Go to your Apache Kafka course
2. **DON'T expand any sections** (leave them collapsed)
3. Open browser console (F12)
4. Wait 5-10 seconds for auto-capture

### Step 3: Check Console Output
You should see:
```
📋 Extracting all sections from page (expanded or collapsed)...
✅ Found 18 total sections (expanded and collapsed)
  Processing Section 1: Kafka Introduction...
    Section is COLLAPSED
    Section is collapsed - skipping lesson extraction
  Processing Section 2: Code Download...
    Section is COLLAPSED
    ...
```

### Step 4: Verify Captured Data
Check the server terminal, you should see:
```
✅ Received Udemy data: Apache Kafka... - 18 sections, 0 lessons, 0 completed
```

### Step 5: Expand One Section
1. Expand "Section 1: Kafka Introduction"
2. Wait 30 seconds for auto-capture OR click "Capture Now"
3. Check server terminal:
```
✅ Received Udemy data: Apache Kafka... - 18 sections, 4 lessons, 1 completed
```

---

## Expected Behavior

| Scenario | Sections Captured | Lessons Captured |
|----------|-------------------|------------------|
| All collapsed | 18 sections | 0 lessons |
| 1 expanded | 18 sections | Lessons from that 1 section |
| 3 expanded | 18 sections | Lessons from those 3 sections |
| All expanded | 18 sections | All lessons from all sections |

---

## Troubleshooting

### Still showing only 1 section?
1. Check console for errors
2. Look for the log: `✅ Found X total sections`
3. If X = 1, the selector might be wrong for your Udemy version

### Sections showing but no lessons?
- This is CORRECT for collapsed sections!
- Expand sections to see lessons
- Check console log: "Section is COLLAPSED"

### Wrong section numbers?
- Check if section titles on page have "Section X:" prefix
- Script extracts number from that format

---

## Quick Test Commands

### In Browser Console (F12):
```javascript
// Count sections on page
document.querySelectorAll('h3.ud-accordion-panel-heading').length

// Show all section titles
Array.from(document.querySelectorAll('h3.ud-accordion-panel-heading')).map(el => el.textContent.trim())

// Check which are expanded
Array.from(document.querySelectorAll('[aria-expanded]')).map(el => ({
  title: el.textContent.substring(0, 50),
  expanded: el.getAttribute('aria-expanded')
}))
```

---

## Files Changed
- ✅ `content-script.js` - Updated section extraction logic

## Files You Need to Test
1. Reload Chrome extension
2. Visit Udemy course
3. Check captured JSON in `activity_data/udemy_enhanced_*.jsonl`

---

Good luck! Let me know if you see all 18 sections now! 🚀
