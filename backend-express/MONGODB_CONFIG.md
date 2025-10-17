# MongoDB Configuration Guide

This Express backend supports switching between MongoDB Atlas (cloud) and Local MongoDB.

## Quick Start

### Option 1: Use the Switcher Script (Easiest)
Run the batch file to switch between databases:
```bash
cd backend-express
switch-db.bat
```

### Option 2: Manual Configuration
Edit the `.env` file and change the `USE_LOCAL_DB` flag:

**For Atlas (Cloud):**
```env
USE_LOCAL_DB=false
```

**For Local MongoDB:**
```env
USE_LOCAL_DB=true
```

## Configuration Details

### Atlas MongoDB (Cloud)
- **URI**: `mongodb+srv://employee360:admin@employee360.n05xtqd.mongodb.net/`
- **Database**: `employee360`
- **Advantages**: 
  - Always accessible
  - No local setup required
  - Automatic backups
  - Scalable

### Local MongoDB
- **URI**: `mongodb://localhost:27017/`
- **Database**: `employee360`
- **Prerequisites**: 
  - MongoDB must be installed and running locally
  - Default port: 27017
- **Advantages**: 
  - Faster response times
  - Works offline
  - Full control over data

## Starting Local MongoDB

### Windows
1. **If MongoDB is installed as a service:**
   ```bash
   net start MongoDB
   ```

2. **If running manually:**
   ```bash
   mongod --dbpath C:\data\db
   ```

### Verify MongoDB is Running
```bash
mongosh
```

## Environment Variables

The `.env` file contains:

```env
# Toggle between local and Atlas
USE_LOCAL_DB=false

# Atlas Configuration
MONGODB_ATLAS_URI=mongodb+srv://employee360:admin@employee360.n05xtqd.mongodb.net/
ATLAS_DATABASE_NAME=employee360

# Local Configuration
MONGODB_LOCAL_URI=mongodb://localhost:27017/
LOCAL_DATABASE_NAME=employee360

# Server Settings
PORT=8001
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Troubleshooting

### Atlas Connection Issues
- Check your internet connection
- Verify the username and password
- Ensure your IP is whitelisted in Atlas (Network Access)

### Local Connection Issues
- Verify MongoDB is running: `mongosh`
- Check if port 27017 is available
- Ensure MongoDB service is started

## Server Output

When starting the server, you'll see which database is being used:

**Atlas:**
```
☁️  Using ATLAS MongoDB connection
📊 Database: employee360
✅ Connected to MongoDB: employee360 (Atlas)
```

**Local:**
```
🏠 Using LOCAL MongoDB connection
📊 Database: employee360
✅ Connected to MongoDB: employee360 (Local)
```

## Security Notes

- The `.env` file contains sensitive credentials
- Never commit `.env` to version control
- Add `.env` to `.gitignore`
- Use environment-specific credentials in production
