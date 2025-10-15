# Application Duplication Fix

## Issue
When refreshing the Application Activity page, applications were appearing multiple times in the list because:
1. The data collector creates new records every collection interval (30 seconds)
2. Multiple records exist for the same application with `is_active: true`
3. The backend API was returning all matching records without deduplication
4. React was rendering duplicate entries

## Solution Implemented

### Backend Fixes (applications.js)

#### 1. `/api/apps/current` Endpoint
**Before:**
```javascript
const currentApps = await db.collection('application_activity')
  .find({ user_id: userId, is_active: true })
  .sort({ is_focused: -1, timestamp: -1 })
  .limit(50)
  .toArray();
```

**After:**
```javascript
const pipeline = [
  { $match: { user_id: userId, is_active: true } },
  { $sort: { timestamp: -1 } },
  // Group by application name and take the first (most recent) document
  {
    $group: {
      _id: '$application',
      doc: { $first: '$$ROOT' }
    }
  },
  { $replaceRoot: { newRoot: '$doc' } },
  { $sort: { is_focused: -1, timestamp: -1 } },
  { $limit: 50 }
];
```

**What it does:**
- Groups records by application name
- Takes only the most recent record for each application
- Ensures unique applications in the response

#### 2. `/api/apps/top-memory-usage` Endpoint
**Similar aggregation pipeline applied:**
- Groups by application name
- Takes most recent record per application
- Sorts by memory usage descending

### Frontend Fixes (ApplicationActivity.js)

#### 1. Client-Side Deduplication
Added extra safety layer in `fetchCurrentApplications()`:
```javascript
const uniqueApps = [];
const seenApps = new Set();

for (const app of data) {
  if (!seenApps.has(app.application)) {
    seenApps.add(app.application);
    uniqueApps.push(app);
  }
}
```

#### 2. Improved React Keys
Changed from simple index-based keys to unique compound keys:
```javascript
// Before
key={`${app.application}-${index}`}
key={index}

// After
key={`current-${app.application}-${app._id || index}`}
key={`summary-${app.application_name || app._id}-${index}`}
key={`memory-${app.application}-${index}`}
```

## Testing

### 1. Test Backend Deduplication
```bash
# In MongoDB Compass or mongosh
use employee360

# Check if duplicates exist
db.application_activity.aggregate([
  { $match: { is_active: true } },
  { $group: { _id: "$application", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } },
  { $sort: { count: -1 } }
])
```

### 2. Test API Response
```bash
# PowerShell
curl http://localhost:8001/api/apps/current | ConvertFrom-Json | Select-Object application | Group-Object application | Where-Object { $_.Count -gt 1 }

# Should return empty (no duplicates)
```

### 3. Test Frontend
1. Open Application Activity page
2. Refresh the page multiple times (F5 or Ctrl+R)
3. Check that each application appears only once
4. Switch between tabs and verify no duplicates
5. Check browser console for deduplication logs

### 4. Test Auto-Refresh
1. Keep the Application Activity page open
2. Wait for the 60-second auto-refresh
3. Verify no duplicates after refresh
4. Open/close some applications
5. Verify list updates correctly without duplicates

## Expected Results

### Current Applications Tab
✅ Each application appears exactly once
✅ Focused application highlighted correctly
✅ Memory and CPU values show most recent data
✅ No duplicate entries on page refresh
✅ No duplicate entries on auto-refresh

### Usage Summary Tab
✅ Unique applications only
✅ Aggregated time data correct
✅ No duplicates on time range change

### Memory Usage Tab
✅ Unique applications only
✅ Sorted by memory usage
✅ No duplicates on refresh

## Monitoring

Check browser console for these log messages:
```
Fetching current applications...
Current apps data: [...]
Deduplicated: X -> Y apps
```

If X != Y, it means duplicates were found and removed client-side (backup safety).

## Database Optimization (Optional)

To prevent duplicates at the source, consider:

### Option 1: Unique Index with TTL
```javascript
db.application_activity.createIndex(
  { user_id: 1, application: 1, is_active: 1 },
  { 
    unique: true,
    partialFilterExpression: { is_active: true }
  }
)
```

### Option 2: Update Collector Logic
Modify `collector.py` to use `updateOne` with `upsert` instead of `insertMany`:
```python
await self.db.application_activity.update_one(
    {
        'user_id': self.user_id,
        'application': friendly_app_name,
        'is_active': True
    },
    {
        '$set': activity_document,
        '$setOnInsert': {'created_at': current_time}
    },
    upsert=True
)
```

### Option 3: Scheduled Cleanup Job
Add a background task to remove old duplicates:
```javascript
// Remove older duplicates, keep only the most recent
db.application_activity.aggregate([
  { $match: { is_active: true } },
  { $sort: { timestamp: -1 } },
  {
    $group: {
      _id: { user_id: '$user_id', application: '$application' },
      docs: { $push: '$$ROOT' }
    }
  },
  {
    $project: {
      toDelete: { $slice: ['$docs', 1, { $size: '$docs' }] }
    }
  }
]).forEach(group => {
  group.toDelete.forEach(doc => {
    db.application_activity.deleteOne({ _id: doc._id });
  });
});
```

## Rollback

If issues occur, revert changes:

### Backend
```bash
git checkout HEAD -- backend-express/routes/applications.js
```

### Frontend
```bash
git checkout HEAD -- frontend/src/pages/ApplicationActivity.js
```

## Performance Impact

✅ **Minimal**: Aggregation pipeline is efficient
✅ **Improved**: Reduces data transfer by eliminating duplicates
✅ **Better UX**: Users see clean, non-duplicate data

## Related Files Modified

1. `backend-express/routes/applications.js`
   - `/api/apps/current` endpoint
   - `/api/apps/top-memory-usage` endpoint

2. `frontend/src/pages/ApplicationActivity.js`
   - `fetchCurrentApplications()` function
   - `fetchTopMemoryApps()` function
   - React key attributes in all table rows

## Additional Notes

- The fix handles duplicates at multiple levels (database query, API response, client-side)
- Deduplication logs in console help diagnose if duplicates still occur
- More unique React keys prevent rendering issues
- Solution is backward compatible with existing data

