# Testing the Fixed Section Extraction

## What Was Fixed

Based on the actual Udemy HTML structure you provided, I've rewritten the `content-script.js` to use the **correct selectors**:

### Key Changes:

1. **Section Container Selector**: `div[data-purpose^="section-panel-"]` inside `div[data-purpose="curriculum-section-container"]`

2. **Section Heading**: `h3.ud-accordion-panel-heading`

3. **Section Title**: `span.ud-accordion-panel-title span`

4. **Expansion State**: `button[aria-expanded]` attribute

5. **Lesson Items**: `li.curriculum-item-link--curriculum-item--OVP5S`

6. **Lesson Title**: `[data-purpose="item-title"]`

7. **Completion Checkbox**: `input[type="checkbox"][data-purpose="progress-toggle-button"]`

## Testing Steps

### 1. Reload the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Find "Udemy Progress Tracker"
3. Click the **Reload** button (circular arrow icon)

### 2. Navigate to Your Kafka Course

1. Go to: https://centrico.udemy.com/course/apache-kafka/learn/
2. Make sure you're on the curriculum page (course content sidebar visible)

### 3. Expand Section 1 (Required)

Since only **expanded sections** have their lessons extracted:

1. In the left sidebar, locate **"Section 1: Kafka Introduction"**
2. If it's collapsed, click to **expand it**
3. You should see 4 lectures appear

### 4. Trigger Data Collection

**Option A - Manual Button:**
- Look for the purple **"📊 Collect Progress"** button in the bottom-right corner
- Click it

**Option B - Browser Console:**
```javascript
// Run this in the browser console (F12)
window.location.reload();
```

### 5. Check the Results

**In Browser Console (F12):**
```
📋 Starting section extraction...
✅ Found 18 sections in curriculum
📦 Section 1: "Kafka Introduction" (EXPANDED)
  → Found 4 lessons
  → Completed: 2/4
📦 Section 2: "Code Download" (COLLAPSED)
  → Section collapsed - no lesson details extracted
...
📊 Extraction complete: 18 sections total
```

**Check Backend Data:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5001/api/udemy-tracker/stats" | ConvertTo-Json -Depth 10
```

**Expected Output:**
```json
{
  "apache-kafka": {
    "entries": 22,
    "latestEntry": {
      "stats": {
        "totalSections": 18,
        "totalLessons": 4,
        "completedLessons": 2,
        "progress": 50
      }
    }
  }
}
```

### 6. Test With Multiple Expanded Sections

For a comprehensive test:

1. **Expand sections 1, 2, and 4** in the sidebar
2. Click **"📊 Collect Progress"** button again
3. Check console output - you should see:
   - Section 1: EXPANDED with 4 lessons
   - Section 2: EXPANDED with 1 lesson
   - Section 3: COLLAPSED with 0 lessons
   - Section 4: EXPANDED with 11 lessons
   - Sections 5-18: COLLAPSED with 0 lessons

**Expected Stats:**
```
totalSections: 18
totalLessons: 16 (4 + 1 + 11)
completedLessons: (whatever you've completed in those sections)
```

## Expected Behavior

### ✅ What Should Work:

1. **All 18 sections** are detected and listed
2. **Section titles** are clean (no "4 lectures • 15min" text)
3. **Collapsed sections** show `isExpanded: false` and `totalLessons: 0`
4. **Expanded sections** show full lesson details
5. **Completion status** is accurately tracked
6. Backend receives all 18 sections in the `sections` array

### ❌ What Won't Work (By Design):

1. **Collapsed sections** won't have lesson details (this is intentional - you said you want section details only when not expanded)
2. Auto-expansion is removed (too unreliable)

## Verification Checklist

- [ ] Extension reloaded successfully
- [ ] On Apache Kafka course page
- [ ] At least Section 1 is expanded
- [ ] Console shows "Found 18 sections in curriculum"
- [ ] Console shows section-by-section extraction log
- [ ] Purple collect button visible in bottom-right
- [ ] Backend stats show `totalSections: 18`
- [ ] JSONL file shows 18 items in `sections` array

## Troubleshooting

### If you still see only 1 section:

1. **Check console for errors**: Open DevTools (F12) → Console tab
2. **Verify you're on the right page**: URL should contain `/learn/` or `/lecture/`
3. **Try hard refresh**: Ctrl + Shift + R
4. **Check server is running**: 
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:5001/health"
   ```

### If extraction fails:

Run this debug command in browser console:
```javascript
document.querySelectorAll('div[data-purpose^="section-panel-"]').length
```

**Expected:** `18`

If you get 0, Udemy might have changed their HTML structure. Let me know!

## Success Criteria

✅ **You'll know it's working when:**
- Console log shows: `✅ Found 18 sections in curriculum`
- Stats endpoint returns: `"totalSections": 18`
- JSONL file contains 18 objects in the `sections` array
- Each section has correct `sectionTitle` and `isExpanded` status

## Next Steps After Success

Once you confirm it's working:

1. **Test on different courses** to ensure it's not course-specific
2. **Test with different numbers of expanded sections**
3. **Verify the data quality** in your backend logs

---

**Created:** October 26, 2025  
**Status:** Ready for testing
