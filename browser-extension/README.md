# Browser Extension Documentation

This Chrome/Edge extension tracks user work patterns and productivity metrics for the Employee360.

## Features

- **Automatic Work Session Tracking**: Records time spent on different websites and applications
- **Productivity Categorization**: Automatically categorizes activities (development, learning, meetings, etc.)
- **Focus Session Management**: Start/stop focused work sessions with notifications
- **Real-time Sync**: Syncs data with the backend API
- **Privacy-Focused**: All data processing happens locally before sync

## Installation

### Development Installation

1. **Build the Extension** (if needed):
   ```bash
   cd browser-extension
   # No build step required for this extension
   ```

2. **Load in Chrome/Edge**:
   - Open Chrome/Edge
   - Navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `browser-extension` folder

3. **Configure Extension**:
   - Click the extension icon in the toolbar
   - Go to Settings
   - Configure API endpoint and authentication

### Production Installation

1. Package the extension as a .zip file
2. Submit to Chrome Web Store or Edge Add-ons store
3. Users can install from the respective stores

## File Structure

```
browser-extension/
├── manifest.json      # Extension configuration
├── background.js      # Service worker for tracking
├── content.js         # Content script for page interaction
├── popup.html         # Extension popup interface
├── popup.js           # Popup functionality
├── options.html       # Settings page
├── options.js         # Settings functionality
├── tracker.js         # Core tracking logic
└── icons/            # Extension icons
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Key Components

### Background Service Worker (background.js)
- Tracks tab changes and time spent
- Categorizes activities automatically
- Handles data synchronization with API
- Manages idle state detection

### Content Script (content.js)
- Tracks user engagement on pages
- Monitors coding activities on development sites
- Detects learning interactions on educational platforms
- Sends engagement data to background script

### Popup Interface (popup.html/js)
- Shows current tracking status
- Displays today's productivity metrics
- Provides quick actions (focus session, break, sync)
- Links to main dashboard

## Configuration

### Default Categories

The extension automatically categorizes websites:

```javascript
const categories = {
  'github.com': 'development',
  'stackoverflow.com': 'development',
  'developer.mozilla.org': 'learning',
  'coursera.org': 'learning',
  'youtube.com': 'entertainment',
  'gmail.com': 'email',
  'zoom.us': 'meeting',
  'teams.microsoft.com': 'meeting'
};
```

### Productivity Scoring

Activities are scored based on category and duration:
- **Development**: 0.9 (high productivity)
- **Learning**: 0.85 (high productivity)
- **Planning**: 0.75 (medium-high productivity)
- **Email**: 0.6 (medium productivity)
- **Meetings**: 0.7 (medium productivity)
- **Social/Entertainment**: 0.4 (low productivity)

## Privacy and Data

### Data Collection
The extension collects:
- Website URLs and page titles
- Time spent on each page
- Application switching patterns
- User engagement metrics

### Data Storage
- Local storage for temporary data
- Chrome storage API for settings
- Sync with backend only when authenticated

### Privacy Measures
- No sensitive content is recorded
- URLs can be anonymized in settings
- User can pause tracking anytime
- Data retention policies configurable

## API Integration

### Authentication
```javascript
// Store user token after login
chrome.storage.local.set({ 
  userToken: 'jwt_token_here',
  apiEndpoint: 'http://localhost:8000/api'
});
```

### Data Sync
The extension syncs data every 5 minutes:
```javascript
// Sync work sessions
const response = await fetch(`${apiEndpoint}/work-patterns/sessions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(sessionData)
});
```

## Permissions

### Required Permissions
- `activeTab`: Access current tab information
- `tabs`: Monitor tab changes
- `storage`: Store settings and temporary data
- `alarms`: Schedule periodic sync
- `idle`: Detect when user is away

### Host Permissions
- Access to API endpoints for data sync
- All URLs for activity tracking

## Settings and Customization

### User Settings
- Enable/disable tracking
- Customize activity categories
- Set sync frequency
- Configure privacy options
- Manage blocked websites

### Advanced Options
- Custom productivity scoring
- Notification preferences
- Data export options
- Integration settings

## Notifications

### Focus Session Notifications
- Start focus session reminder
- Break time suggestions
- Achievement notifications
- Daily/weekly summaries

### Productivity Alerts
- Excessive social media usage
- Long periods without breaks
- Meeting overload warnings
- Goal achievement celebrations

## Development

### Local Testing
1. Make changes to extension files
2. Reload extension in Chrome/Edge
3. Test functionality on various websites
4. Check console for errors

### Debugging
- Use Chrome DevTools for popup and options pages
- Check background script logs in extension details
- Monitor network requests in DevTools
- Use Chrome storage inspector

### Building for Production
```bash
# Create production package
zip -r productivity-tracker.zip . -x "*.git*" "README.md" "*.md"
```

## Troubleshooting

### Common Issues

**Extension not tracking**
- Check if tracking is enabled in popup
- Verify permissions are granted
- Reload the extension

**Sync not working**
- Check internet connection
- Verify API endpoint in settings
- Ensure valid authentication token

**High CPU usage**
- Reduce sync frequency in settings
- Check for infinite loops in content scripts
- Monitor background script performance

### Debug Information
Access debug info through:
1. Extension popup → Settings → Debug
2. Chrome extensions page → Details → Inspect views

## Security Considerations

### Content Security Policy
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### Data Validation
- Sanitize all user inputs
- Validate URLs before processing
- Limit data size to prevent memory issues

### API Security
- Use HTTPS for all API calls
- Implement token refresh mechanism
- Validate server certificates

## Performance Optimization

### Memory Management
- Clean up old session data
- Limit stored data size
- Use efficient data structures

### Network Optimization
- Batch API requests
- Implement request retry logic
- Cache frequently accessed data

### Battery Optimization
- Reduce background processing
- Use efficient timers
- Minimize idle detection frequency

## Analytics and Metrics

### Usage Tracking
- Track feature usage (optional)
- Monitor error rates
- Measure sync success rates

### Performance Metrics
- Memory usage monitoring
- Network request timing
- User engagement patterns

## Future Enhancements

### Planned Features
- AI-powered activity classification
- Cross-device synchronization
- Team productivity insights
- Integration with calendar apps
- Voice commands for session management

### Technical Improvements
- Manifest V3 optimization
- WebAssembly for performance
- Offline functionality
- Enhanced privacy controls

## Support and Feedback

### Bug Reports
Include:
- Browser version
- Extension version
- Steps to reproduce
- Console error messages

### Feature Requests
- Use GitHub issues
- Describe use case
- Provide mockups if applicable

### Contributing
1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request
5. Update documentation