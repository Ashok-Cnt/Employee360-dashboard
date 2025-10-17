# 🔧 MongoDB Connection Troubleshooting Guide

## Current Issue
Your Express backend is trying to connect to MongoDB Atlas but getting a **connection timeout error** (`ETIMEDOUT`).

## ✅ Solution 1: Fix MongoDB Atlas Connection (Recommended for Cloud)

### Step 1: Whitelist Your IP Address in Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Log in to your account
3. Select your project: **employee360**
4. Click on **"Network Access"** in the left sidebar (under Security)
5. Click **"Add IP Address"** button
6. Choose one of these options:
   
   **Option A: Add Current IP (More Secure)**
   - Click "Add Current IP Address"
   - Click "Confirm"
   
   **Option B: Allow from Anywhere (For Development Only)**
   - Click "Allow Access from Anywhere"
   - This adds `0.0.0.0/0` (allows all IPs)
   - Click "Confirm"
   - ⚠️ **Warning**: Only use this for development, not production!

7. Wait 1-2 minutes for changes to take effect

### Step 2: Test the Connection

After whitelisting, run this command:
```bash
cd backend-express
node test-connection.js
```

If successful, you'll see:
```
✅ Connected to MongoDB Atlas successfully!
✅ Selected database: employee360
📚 Found X collections: ...
```

### Step 3: Start Your Server

```bash
node server.js
```

---

## ✅ Solution 2: Use Local MongoDB (For Offline Development)

If you want to use local MongoDB instead of Atlas:

### Step 1: Start Local MongoDB

**Option A: If MongoDB is installed as a service:**
```powershell
net start MongoDB
# or try
net start "MongoDB Server"
```

**Option B: Start MongoDB manually:**
```powershell
# Find your MongoDB installation directory, then run:
mongod --dbpath C:\data\db
```

**Option C: Install MongoDB Community Edition:**
1. Download from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. Start the service

### Step 2: Switch to Local Database

Run the switcher script:
```bash
cd backend-express
switch-db.bat
```

Choose option `2` for Local MongoDB.

OR manually edit `.env`:
```env
USE_LOCAL_DB=true
```

### Step 3: Test Local Connection

```bash
mongosh
```

If it connects, you're good! Then test the app:
```bash
node test-connection.js
```

### Step 4: Import Data to Local MongoDB (Optional)

If you need data from Atlas in your local database:
```bash
# Export from Atlas (if you have mongodump installed)
mongodump --uri="mongodb+srv://employee360:admin@employee360.n05xtqd.mongodb.net/employee360" --out=backup

# Import to local
mongorestore --db employee360 backup/employee360
```

---

## 🎯 Quick Switch Between Databases

### Switch to Atlas:
```bash
cd backend-express
switch-db.bat
# Choose option 1
```

### Switch to Local:
```bash
cd backend-express
switch-db.bat
# Choose option 2
```

---

## 📊 Current Configuration

**Atlas MongoDB:**
- URI: `mongodb+srv://employee360:admin@employee360.n05xtqd.mongodb.net/`
- Database: `employee360`
- Status: ❌ Connection timeout (IP not whitelisted)

**Local MongoDB:**
- URI: `mongodb://localhost:27017/`
- Database: `employee360`
- Status: ❓ Service not running

---

## 🚀 Recommended Next Steps

1. **For Cloud Development**: Fix Atlas by whitelisting your IP (Solution 1)
2. **For Offline Development**: Start local MongoDB (Solution 2)
3. **For Both**: Use the switcher script to toggle between them easily

---

## ❓ Common Errors

### Error: ETIMEDOUT
- **Cause**: IP address not whitelisted in Atlas
- **Fix**: Add your IP in Atlas Network Access settings

### Error: ECONNREFUSED
- **Cause**: Local MongoDB is not running
- **Fix**: Start MongoDB service or mongod process

### Error: Authentication failed
- **Cause**: Wrong username/password
- **Fix**: Check credentials in `.env` file

---

## 📞 Need Help?

Run the connection test to diagnose:
```bash
cd backend-express
node test-connection.js
```

This will show you exactly what's wrong with your connection.
