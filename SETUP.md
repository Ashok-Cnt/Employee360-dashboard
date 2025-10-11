# Employee360 Dashboard - Setup and Run Instructions

## Quick Start

### Prerequisites
- Node.js and npm installed
- Python 3.x installed
- Git (optional)

### Running the Application

#### Option 1: Using Batch Scripts (Recommended for Windows)

1. **Start Frontend:**
   ```
   Double-click `start-frontend.bat` or run in terminal:
   .\start-frontend.bat
   ```
   This will start the React frontend on http://localhost:3000

2. **Start Backend:**
   ```
   Double-click `start-backend.bat` or run in terminal:
   .\start-backend.bat
   ```
   This will install dependencies and start the Python backend

#### Option 2: Manual Setup

1. **Frontend Setup:**
   ```powershell
   cd frontend
   npm install
   npm start
   ```

2. **Backend Setup:**
   ```powershell
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

### VS Code Tasks

VS Code tasks have been configured in `.vscode/tasks.json`. You can run them via:
- Ctrl+Shift+P → "Tasks: Run Task" → Select the desired task

Available tasks:
- Start Frontend
- Start Backend  
- Install Frontend Dependencies
- Install Backend Dependencies

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000 (default FastAPI port)

### Browser Extension

To load the browser extension:
1. Open Chrome/Edge
2. Go to Extensions page (chrome://extensions/)
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `browser-extension` folder

### Troubleshooting

#### Port 3000 Already in Use
If you get an error about port 3000 being in use:
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

#### Dependencies Issues
Make sure you have the latest versions of Node.js and Python installed.

### Project Structure

```
Employee360-dashboard/
├── frontend/          # React frontend application
├── backend/           # Python FastAPI backend
├── browser-extension/ # Browser extension for productivity tracking
├── database/          # Database setup scripts
├── start-frontend.bat # Windows script to start frontend
├── start-backend.bat  # Windows script to start backend
└── .vscode/          # VS Code configuration
```