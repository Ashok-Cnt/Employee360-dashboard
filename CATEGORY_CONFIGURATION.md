# Category Configuration Feature

## Overview
The Category Configuration page allows users to customize how applications are categorized in the Employee360 dashboard. Users can manage categories and assign applications to different categories based on their workflow preferences.

## Features

### 1. **Category Management**
- View all existing categories with their colors and icons
- Edit category properties (name, icon, color)
- Add new custom categories
- Delete categories (with confirmation)

### 2. **Application Assignment**
- Add applications to categories using autocomplete search
- Remove applications from categories with a single click
- View all applications currently assigned to each category
- Prevent duplicate assignments within the same category

### 3. **Visual Customization**
- Choose from predefined icons (Work, People, Coffee, Apps)
- Select custom colors using a color picker
- Visual preview of categories with their colors and icons

### 4. **Data Persistence**
- Save all changes to the backend
- Automatic loading of saved configurations
- Reset to default categories option

## User Interface

### Category Cards
Each category is displayed as a card containing:
- **Header**: Category icon, name, and action buttons (Edit/Delete)
- **Application List**: Chips showing all applications in the category
- **Add Button**: Opens dialog to add more applications

### Dialogs

#### Add Applications Dialog
- Autocomplete search field to find applications
- Filters out applications already in the category
- Multi-select support with chips
- Shows count of selected applications

#### Edit Category Dialog
- Text field for category name
- Dropdown for icon selection
- Color picker for category color
- Update button to save changes

#### Add New Category Dialog
- Similar to edit dialog
- Creates a new category with unique ID
- Adds to the category list

## API Endpoints

### Backend (FastAPI)

#### `GET /api/categories`
Returns all categories with their configurations.

**Response:**
```json
{
  "categories": [
    {
      "id": "productivity",
      "name": "Productivity",
      "icon": "Work",
      "color": "#4caf50",
      "applications": ["Visual Studio Code", "Excel", ...]
    }
  ]
}
```

#### `POST /api/categories`
Updates the entire category configuration.

**Request Body:**
```json
{
  "categories": [...]
}
```

#### `GET /api/applications`
Returns all unique applications from activity data.

**Response:**
```json
{
  "applications": ["Visual Studio Code", "Chrome", "Teams", ...]
}
```

#### `GET /api/categories/{category_id}`
Returns a specific category by ID.

#### `GET /api/categories/app/{app_name}`
Returns the category for a specific application.

#### `POST /api/categories/reset`
Resets categories to default configuration.

## Default Categories

### 1. Productivity (Green 🟢)
- Development tools (VS Code, IntelliJ, Eclipse, PyCharm)
- Office applications (Excel, Word, PowerPoint)
- Browsers (Chrome, Firefox, Edge)
- Text editors (Notepad, Sublime Text)

### 2. Communication (Blue 🔵)
- Messaging (Microsoft Teams, Slack, Discord)
- Video conferencing (Zoom, Skype)
- Email (Outlook, Gmail, Thunderbird)

### 3. Break (Orange 🟠)
- Entertainment (YouTube, Netflix, Spotify)
- Gaming (Steam, Epic Games)
- Social media (Twitter, Facebook, Instagram, Reddit)

## Data Storage

### Location
Category configuration is stored in:
```
backend/data/category_config.json
```

### Format
```json
{
  "categories": [...],
  "updated_at": "2025-10-22T10:30:00"
}
```

## Usage Guide

### Adding Applications to a Category
1. Click the "Add Applications" button on any category card
2. Search for applications in the autocomplete field
3. Select multiple applications
4. Click "Add" to assign them to the category

### Editing a Category
1. Click the Edit icon (✏️) on the category card
2. Modify the name, icon, or color
3. Click "Update" to save changes

### Creating a New Category
1. Click "Add Category" in the top right
2. Enter category name (e.g., "Development", "Learning")
3. Select an icon and color
4. Click "Add Category"

### Removing Applications
1. Click the × icon on any application chip
2. The application is removed immediately
3. Remember to click "Save All Changes" to persist

### Saving Changes
1. Make all your desired changes
2. Click "Save All Changes" button in the top right
3. A success message will confirm the save

## Integration with Other Pages

The category configuration affects how applications are displayed in:

### Work Patterns Page
- Applications are grouped by their assigned categories
- Category colors are used in charts and visualizations
- Focus switches are organized by category

### Dashboard
- Time distribution charts use category colors
- Activity metrics are grouped by category

### Application Activity
- Applications are filtered and grouped by category

## Technical Details

### Frontend Components
- **React**: Category management UI
- **Material-UI**: Cards, dialogs, chips, buttons
- **Axios**: API communication
- **State Management**: React hooks (useState, useEffect)

### Backend Components
- **FastAPI**: REST API endpoints
- **Pydantic**: Data validation models
- **JSON Storage**: File-based configuration storage

### File Structure
```
frontend/
  src/
    pages/
      CategoryConfiguration.js    # Main configuration page

backend/
  app/
    routers/
      categories.py               # API endpoints
  data/
    category_config.json          # Stored configuration
    activity_data.jsonl           # Activity data with applications
```

## Navigation

The Category Configuration page is accessible from:
- **Sidebar**: Click "Category Configuration" (⚙️ Settings icon)
- **URL**: `/category-configuration`

## Future Enhancements

Potential improvements for future versions:
1. **Drag-and-drop**: Reorder categories
2. **Import/Export**: Share configurations between users
3. **Templates**: Pre-defined category sets for different roles
4. **Auto-categorization**: AI-powered application categorization
5. **Usage statistics**: Show which categories are most used
6. **Bulk operations**: Add/remove multiple applications at once
7. **Category rules**: Pattern matching for automatic assignment
8. **Icon library**: More icon options for categories

## Troubleshooting

### Applications Not Loading
- Check if backend is running on port 8001
- Verify activity_data.jsonl exists and contains application data
- Check browser console for API errors

### Changes Not Saving
- Ensure you click "Save All Changes" button
- Check backend logs for permission errors
- Verify data directory has write permissions

### Categories Reset on Reload
- Changes must be saved using "Save All Changes"
- Check if category_config.json is being created
- Verify backend has write access to data directory

## Best Practices

1. **Descriptive Names**: Use clear, descriptive category names
2. **Logical Grouping**: Group similar applications together
3. **Regular Review**: Periodically review and update categories
4. **Backup**: Save configuration before making major changes
5. **Color Coding**: Use distinct colors for easy visual identification
