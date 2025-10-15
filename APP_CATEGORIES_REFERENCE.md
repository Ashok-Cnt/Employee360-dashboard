# Application Categories Reference

## Quick Reference

This document lists all pre-configured applications and their categories for the Employee360 tracking system.

---

## Category: Productivity
**Description**: Applications for document creation, note-taking, and general office work

- Microsoft Word
- Microsoft Excel
- Microsoft PowerPoint
- Microsoft Outlook
- Microsoft OneNote
- Adobe Acrobat
- Notepad++
- Sublime Text
- Atom
- Google Docs
- Evernote
- Notion

**Focus App**: ✅ Yes (Word, Excel, PowerPoint, OneNote)

---

## Category: Development
**Description**: Software development tools, IDEs, and database management

- Visual Studio Code ✅ **Focus App**
- Visual Studio
- JetBrains Rider ✅ **Focus App**
- IntelliJ IDEA ✅ **Focus App**
- PyCharm ✅ **Focus App**
- WebStorm ✅ **Focus App**
- Android Studio
- Xcode
- Eclipse
- MongoDB Compass ✅ **Focus App**
- MySQL
- PostgreSQL
- Postman ✅ **Focus App**
- Insomnia
- Git
- GitHub Desktop
- Sourcetree

**Focus Apps**: Most development tools are considered focus apps

---

## Category: Communication
**Description**: Email, messaging, and video conferencing

- Microsoft Teams
- Slack
- Discord ⚠️ **Can be Distraction**
- Zoom
- Skype
- WhatsApp ⚠️ **Can be Distraction**
- Telegram ⚠️ **Can be Distraction**
- Microsoft Outlook
- Gmail
- Thunderbird

**Note**: Some communication apps (Discord, WhatsApp, Telegram) are also marked as potential distractions when used for non-work purposes.

---

## Category: Media
**Description**: Music players, video players, and creative tools

### Creative Tools (Focus Apps)
- Adobe Photoshop ✅ **Focus App**
- Adobe Illustrator ✅ **Focus App**
- Adobe Premiere Pro
- Adobe After Effects
- GIMP
- Audacity
- OBS Studio

### Media Players
- Spotify
- VLC Media Player
- Netflix ⚠️ **Distraction**
- YouTube ⚠️ **Distraction**
- iTunes
- Winamp

**Focus Apps**: Creative/design tools only

---

## Category: Browsers
**Description**: Web browsers (content may be work or non-work related)

- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Opera Browser
- Brave Browser
- Safari
- Vivaldi

**Note**: Browsers are not categorized as focus or distraction since they can be used for both purposes. Consider using browser extension for URL-level tracking.

---

## Category: Utilities
**Description**: System tools, file management, and system utilities

- File Explorer
- Notepad
- Calculator
- Task Manager
- 7-Zip
- WinRAR
- PuTTY
- FileZilla
- Wireshark

**Focus Apps**: None (utilities are support tools)

---

## Category: Non-Work
**Description**: Gaming, social media, and entertainment (typically distractions)

### Gaming Platforms ⚠️ **Distraction**
- Steam
- EA Origin
- Epic Games Launcher
- Battle.net
- Xbox

### Social Media ⚠️ **Distraction**
- Facebook
- Instagram
- Twitter
- Reddit
- TikTok

**All apps in this category are marked as distractions**

---

## Focus vs Distraction Classification

### Focus Apps (Productivity-Oriented)
Applications where active use indicates productive work:

**Development**
- Visual Studio Code
- JetBrains Rider
- IntelliJ IDEA
- PyCharm
- WebStorm

**Office & Productivity**
- Microsoft Word
- Microsoft Excel
- Microsoft PowerPoint

**Design**
- Adobe Photoshop
- Adobe Illustrator

**Development Tools**
- MongoDB Compass
- Postman

### Distraction Apps (Non-Work-Oriented)
Applications that typically indicate time away from productive work:

**Social Media**
- Facebook
- Instagram
- Twitter
- Reddit
- TikTok

**Entertainment**
- YouTube
- Netflix

**Gaming**
- Steam
- Discord (gaming context)

**Communication (Personal)**
- WhatsApp (personal use)
- Telegram (personal use)

---

## Adding Custom Applications

### Method 1: Edit Collector Code
Add to `collector.py`:

```python
APP_CATEGORIES = {
    'productivity': [
        # ... existing apps ...
        'Your Custom App',  # Add here
    ],
}

FOCUS_APPS = [
    # ... existing apps ...
    'Your Custom App',  # Add if it's a focus app
]

DISTRACTION_APPS = [
    # ... existing apps ...
    'Your Custom App',  # Add if it's a distraction
]
```

### Method 2: Process Name Mapping
Add to `get_friendly_app_name()` method:

```python
app_name_map = {
    # ... existing mappings ...
    'yourcustomapp.exe': 'Your Custom App',
}
```

---

## Category Guidelines

### Should an app be in "Productivity"?
✅ Yes if:
- Used for document creation
- Note-taking or organizing information
- Office work tasks
- Email for work purposes

❌ No if:
- Primary purpose is development (use "Development")
- Primary purpose is communication (use "Communication")

### Should an app be in "Development"?
✅ Yes if:
- Code editing or writing
- Database management
- API testing or development
- Version control
- Build tools or compilers

### Should an app be a "Focus App"?
✅ Yes if:
- Requires sustained attention and concentration
- Primary work tool for job function
- Active use indicates productive work time
- Examples: IDE, design tools, office apps

❌ No if:
- Can run passively in background (music player)
- Frequently used for breaks (chat apps)
- Multi-purpose tool (browsers)

### Should an app be a "Distraction"?
✅ Yes if:
- Primary purpose is entertainment
- Social networking (non-work)
- Gaming
- Video streaming for entertainment

❌ No if:
- Can be used for legitimate work (browsers, Slack)
- System utility
- Professional tool

---

## Special Cases

### Browsers
- **Category**: browsers
- **Focus**: ❌ Not marked as focus app
- **Distraction**: ❌ Not marked as distraction
- **Reason**: Content determines value, not the browser itself
- **Recommendation**: Use browser extension for URL-level tracking

### Microsoft Teams / Slack
- **Category**: communication
- **Focus**: ❌ Not marked as focus app
- **Distraction**: ❌ Not marked as distraction
- **Reason**: Essential work tools but can be distracting
- **Note**: Time spent here shows in communication category

### Discord
- **Category**: communication
- **Focus**: ❌ No
- **Distraction**: ✅ Yes (if used for gaming/personal)
- **Note**: Can be work-related for some teams, but primarily gaming-focused

### Spotify / Music Players
- **Category**: media
- **Focus**: ❌ No
- **Distraction**: ❌ No
- **Reason**: Background apps that aid focus for some users
- **Note**: Time tracked separately but not counted as focus or distraction

---

## Productivity Score Calculation

### Formula
```
Productivity Score = (Focus Time / Total Tracked Time) × 100
```

### What Counts as Focus Time?
- Any time spent with a Focus App having window focus
- Only includes: Development, Office apps, Design tools
- Excludes: Background time, browsers, utilities

### What Counts as Distraction Time?
- Any time spent with a Distraction App active
- Includes: Social media, gaming, entertainment streaming
- Impacts: Lowers overall productivity percentage

### Example Calculation
```
8-hour workday:
- 5 hours in Visual Studio Code (focused) = Focus Time
- 1 hour in Chrome (mixed use) = Neutral
- 1 hour in Microsoft Teams (communication) = Neutral
- 1 hour in YouTube (entertainment) = Distraction Time

Productivity Score = (5 / 8) × 100 = 62.5%
```

---

## Frequently Asked Questions

### Q: Why isn't my app showing up?
A: The app needs to be running, have a visible window, and use more than 10MB of memory to be tracked.

### Q: Can I track time in specific websites within browsers?
A: Not with the current collector. This requires a browser extension for URL-level tracking.

### Q: Why is my productivity score low even though I'm working?
A: Make sure your primary work apps are in the Focus Apps list. Add them if missing.

### Q: How do I change an app's category?
A: Edit the `APP_CATEGORIES` dictionary in `collector.py` and restart the collector.

### Q: What if an app fits multiple categories?
A: Choose the category that best represents its primary use case in your workflow.

### Q: Are background apps counted?
A: Yes, but separately. Only focused time counts toward productivity scores.

---

## Configuration Tips

### For Developers
Add all your IDEs and development tools to ensure accurate focus time tracking.

### For Designers
Make sure Adobe Creative Suite and design tools are properly categorized.

### For Mixed Roles
Customize categories based on your primary work activities. An app that's a distraction for one person might be work-related for another.

### For Managers
Use category breakdown to understand team activity patterns. High communication time might indicate collaboration, not distraction.

---

## Updates and Maintenance

When adding new applications to your environment:

1. **Observe** what name appears in activity logs
2. **Map** the process name to a friendly name
3. **Categorize** based on primary use
4. **Classify** as focus/distraction if applicable
5. **Restart** the collector to apply changes

Regular review of uncategorized apps helps maintain accurate tracking.

