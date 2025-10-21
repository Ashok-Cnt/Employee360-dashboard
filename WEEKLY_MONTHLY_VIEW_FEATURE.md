# Weekly and Monthly View Feature - Work Pattern Analysis

## Overview
Enhanced the date filter to support **Daily**, **Weekly**, and **Monthly** views, allowing users to analyze aggregated activity data across different time periods.

## New Features

### 1. View Mode Selection
Users can switch between three view modes:

#### 📅 Daily View
- View activity for a single day
- Real-time data for today
- Historical data for past dates
- Auto-refresh every 60 seconds (today only)

#### 📊 Weekly View
- Aggregated data for a full week (Monday-Sunday)
- Dropdown shows all available weeks
- Format: "Oct 14 - Oct 20, 2024"
- Combines data from all 7 days

#### 📈 Monthly View
- Aggregated data for an entire month
- Dropdown shows all available months
- Format: "October 2024"
- Combines data from all days in the month

### 2. Smart Data Aggregation

#### How Weekly Data is Calculated
```javascript
// For each app across the week:
- Total focus time = Sum of all days' focus time
- Total running time = Sum of all days' running time
- Peak memory = Maximum across all days
- Focus switches = Combined from all days

// For hourly summary:
- Each hour shows AVERAGE across the week
- Example: 09:00 shows avg productivity for 09:00 across Mon-Sun
```

#### How Monthly Data is Calculated
```javascript
// Same aggregation logic as weekly, but across all days in month
- Apps: Cumulative totals for the entire month
- Hours: Average activity per hour across all days
- System: Total monitoring hours, avg CPU, etc.
```

### 3. Visual Indicators

#### Mode Chips
- **Daily**: "Live Data" (green) or "Historical Data" (gray)
- **Weekly**: "Weekly Aggregated Data" (blue)
- **Monthly**: "Monthly Aggregated Data" (purple)

#### Additional Info
- Shows date range for weekly view
- Shows month name for monthly view
- Auto-refresh indicator (daily today only)

## Technical Implementation

### State Variables Added
```javascript
const [dateFilterMode, setDateFilterMode] = React.useState('daily');
const [selectedWeek, setSelectedWeek] = React.useState('');
const [selectedMonth, setSelectedMonth] = React.useState('');
const [weeklyData, setWeeklyData] = React.useState(null);
const [monthlyData, setMonthlyData] = React.useState(null);
```

### Helper Functions

#### 1. getWeekRange()
Calculates Monday-Sunday range for any date:
```javascript
Input: '2024-10-18'
Output: {
  start: '2024-10-14',  // Monday
  end: '2024-10-20',     // Sunday
  label: 'Oct 14 - Oct 20, 2024'
}
```

#### 2. getMonthRange()
Calculates first and last day of month:
```javascript
Input: (2024, 10)  // October
Output: {
  start: '2024-10-01',
  end: '2024-10-31',
  label: 'October 2024'
}
```

#### 3. getWeekOptions (memoized)
Generates unique weeks from available dates:
```javascript
const getWeekOptions = React.useMemo(() => {
  // Extracts all unique weeks from available dates
  // Sorted newest to oldest
  // Returns array of week objects
}, [availableDates]);
```

#### 4. getMonthOptions (memoized)
Generates unique months from available dates:
```javascript
const getMonthOptions = React.useMemo(() => {
  // Extracts all unique months from available dates
  // Sorted newest to oldest
  // Returns array of month objects
}, [availableDates]);
```

### Data Fetching Functions

#### fetchRangeData()
Fetches and aggregates data for a date range:
```javascript
const fetchRangeData = async (startDate, endDate) => {
  // 1. Loop through each day in range
  for (let d = start; d <= end; d++) {
    // 2. Fetch daily data for each day
    const data = await fetch(`/api/activity/daily-summary/${date}`);
    allData.push(data);
  }
  
  // 3. Aggregate all days into single dataset
  const aggregated = aggregateMultipleDays(allData);
  setActivityData(aggregated);
};
```

#### aggregateMultipleDays()
Combines data from multiple days:
```javascript
const aggregateMultipleDays = (daysData) => {
  // System Aggregation
  - Sum: monitoring hours, productive hours, idle hours
  - Average: CPU usage
  
  // Apps Aggregation
  - Sum: focus time, running time for each app
  - Max: peak memory
  - Combine: focus switches
  
  // Hourly Summary Aggregation
  - Average: each hour's activity across all days
  
  return aggregatedData;
};
```

### UI Component Structure

```jsx
<Paper>
  {/* Mode Toggle Buttons */}
  <Box>
    <Button>📅 Daily</Button>
    <Button>📊 Weekly</Button>
    <Button>📈 Monthly</Button>
  </Box>
  
  {/* Conditional Filters */}
  {dateFilterMode === 'daily' && (
    // Date dropdown + date picker + status chips
  )}
  
  {dateFilterMode === 'weekly' && (
    // Week dropdown + status chip
  )}
  
  {dateFilterMode === 'monthly' && (
    // Month dropdown + status chip
  )}
</Paper>
```

## Use Cases

### Daily View
**When to use:**
- Monitoring today's real-time activity
- Reviewing a specific day's work
- Detailed hour-by-hour analysis

**Example:**
```
User selects: "Today (Oct 19, 2024)"
Shows: Real-time data, auto-refreshes every minute
Charts: Hour-by-hour breakdown of today's activity
```

### Weekly View
**When to use:**
- Reviewing last week's productivity
- Comparing different weeks
- Understanding weekly patterns

**Example:**
```
User selects: "Oct 14 - Oct 20, 2024"
Shows: Aggregated 7-day data
Charts: Combined totals + average hourly patterns
Apps: Total usage across the week
```

### Monthly View
**When to use:**
- Monthly productivity reports
- Long-term trend analysis
- Performance reviews

**Example:**
```
User selects: "October 2024"
Shows: Aggregated 31-day data
Charts: Monthly totals + average daily patterns
Apps: Total usage for entire month
```

## Data Flow

### Daily Mode
```
User clicks "Today"
  ↓
fetchData('2024-10-19')
  ↓
GET /api/activity/today
  ↓
Display single day data
  ↓
Auto-refresh every 60s
```

### Weekly Mode
```
User selects week "Oct 14 - Oct 20"
  ↓
fetchRangeData('2024-10-14', '2024-10-20')
  ↓
Loop: GET /api/activity/daily-summary/2024-10-14
      GET /api/activity/daily-summary/2024-10-15
      ... (7 requests)
  ↓
aggregateMultipleDays([7 days of data])
  ↓
Display aggregated weekly data
  ↓
No auto-refresh
```

### Monthly Mode
```
User selects "October 2024"
  ↓
getMonthRange(2024, 10) → Oct 1 to Oct 31
  ↓
fetchRangeData('2024-10-01', '2024-10-31')
  ↓
Loop: GET /api/activity/daily-summary/... (31 requests)
  ↓
aggregateMultipleDays([31 days of data])
  ↓
Display aggregated monthly data
  ↓
No auto-refresh
```

## Charts Behavior

### Work Pattern Chart (Pie/Doughnut)
- **Daily**: Shows single day's distribution
- **Weekly**: Shows total hours across week
- **Monthly**: Shows total hours across month

### Category Focus Chart (Stacked Bar)
- **Daily**: Hour-by-hour breakdown
- **Weekly**: Average per hour across 7 days
- **Monthly**: Average per hour across all days

### Time Distribution Chart (Doughnut)
- **Daily**: Single day's category breakdown
- **Weekly**: Total time per category for week
- **Monthly**: Total time per category for month

### Heatmap
- **Daily**: 24-hour intensity map
- **Weekly**: Average intensity per hour
- **Monthly**: Average intensity per hour

## Performance Considerations

### Loading Times
- **Daily**: Fast (1 API call)
- **Weekly**: Moderate (7 API calls)
- **Monthly**: Slower (up to 31 API calls)

### Optimization
- Requests run sequentially (could be parallelized)
- Failed requests are skipped (no error for missing days)
- Data is cached in state until filter changes

### Future Improvements
1. **Backend aggregation**: Add `/api/activity/weekly/:week` endpoint
2. **Parallel fetching**: Use `Promise.all()` for faster loading
3. **Caching**: Store fetched weeks/months in local storage
4. **Pagination**: Load months with many days in batches

## Benefits

### For Users
1. **Flexible Analysis**: Choose granularity (day/week/month)
2. **Trend Identification**: See patterns across time
3. **Productivity Reports**: Generate weekly/monthly summaries
4. **Comparison**: Compare different weeks or months
5. **Planning**: Review past periods for better planning

### For Management
1. **Team Reports**: Aggregate team activity weekly/monthly
2. **Performance Metrics**: Monthly productivity statistics
3. **Trends**: Identify productivity patterns
4. **Insights**: Understand work habits over time

## Testing Checklist

- [x] Daily mode works (today + historical)
- [x] Weekly mode shows correct weeks
- [x] Monthly mode shows correct months
- [x] Week dropdown populated from available dates
- [x] Month dropdown populated from available dates
- [x] Data aggregates correctly (apps, hours, system)
- [x] Charts update when mode changes
- [x] Status chips show correct mode
- [x] Auto-refresh only works in daily mode
- [x] Missing days handled gracefully
- [x] Loading indicator shows during aggregation

## Files Modified

- `frontend/src/pages/WorkPatterns.js`
  - Added state variables for week/month modes
  - Added helper functions for date range calculation
  - Added `fetchRangeData()` for multi-day fetching
  - Added `aggregateMultipleDays()` for data aggregation
  - Updated `useEffect()` for mode-based fetching
  - Enhanced UI with mode toggle buttons
  - Added conditional filters for daily/weekly/monthly

## Example Usage

### Scenario 1: Review Last Week
```
1. Click "📊 Weekly" button
2. Select "Oct 14 - Oct 20, 2024" from dropdown
3. Wait for data to load (7 days aggregated)
4. View combined stats for the entire week
5. Charts show total hours and average patterns
```

### Scenario 2: Generate Monthly Report
```
1. Click "📈 Monthly" button
2. Select "September 2024" from dropdown
3. Wait for data to load (30 days aggregated)
4. View comprehensive monthly statistics
5. Export or screenshot for reports
```

### Scenario 3: Compare Different Periods
```
1. View weekly data for "Oct 7-13"
2. Note total productive hours
3. Switch to "Oct 14-20"
4. Compare productivity between weeks
```

## Conclusion

The Weekly and Monthly view features provide powerful aggregation capabilities, enabling users to analyze their work patterns across different time scales. The implementation seamlessly integrates with existing charts and deep drill-down functionality, offering a comprehensive productivity analysis tool.
