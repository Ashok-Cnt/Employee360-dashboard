# 🦙 Ollama Setup Guide - 100% Free AI Suggestions

This guide will help you set up **Ollama** for completely free, local AI-powered suggestions in the Employee360 Dashboard. No API keys, no costs, no cloud services needed!

---

## 📋 Table of Contents
1. [What is Ollama?](#what-is-ollama)
2. [Installation Steps](#installation-steps)
3. [Download AI Model](#download-ai-model)
4. [Verify Installation](#verify-installation)
5. [Configuration](#configuration)
6. [Start Backend](#start-backend)
7. [Test AI Suggestions](#test-ai-suggestions)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Options](#advanced-options)

---

## 🤔 What is Ollama?

**Ollama** is a free, open-source application that lets you run powerful AI models locally on your computer. It's like having ChatGPT running on your own machine!

### Benefits:
- ✅ **100% Free** - No API keys, no subscriptions, no usage limits
- ✅ **Privacy** - Your data never leaves your computer
- ✅ **Fast** - No network latency (after initial download)
- ✅ **Offline** - Works without internet (after model download)
- ✅ **Easy** - Simple installation and setup
- ✅ **Powerful** - Uses state-of-the-art Llama 3.2 model

### System Requirements:
- **Windows** 10/11 (64-bit)
- **RAM**: 8GB minimum (16GB recommended)
- **Disk Space**: ~5GB for Llama 3.2 model
- **CPU**: Any modern processor (GPU optional but faster)

---

## 📥 Installation Steps

### Step 1: Download Ollama

1. Open your browser and go to: **https://ollama.ai/download**
2. Click the **"Download for Windows"** button
3. Wait for the installer to download (~50-100MB)

### Step 2: Install Ollama

1. **Double-click** the downloaded installer (`OllamaSetup.exe`)
2. Follow the installation wizard
3. Click **"Install"** (administrator permission may be required)
4. Wait for installation to complete (~1 minute)
5. Click **"Finish"** when done

**Note**: Ollama will start automatically in the background. Look for the Ollama icon in your system tray (bottom-right corner).

---

## 🧠 Download AI Model

After installing Ollama, you need to download the AI model. We'll use **Llama 3.2** (3.2 billion parameters) - it's fast, capable, and works on most computers.

### Option 1: Using PowerShell (Recommended)

1. Open **PowerShell** (Win + X → Windows PowerShell)
2. Run this command:
   ```powershell
   ollama pull llama3.2
   ```
3. Wait for download to complete (~2GB, takes 5-15 minutes depending on internet speed)

### Option 2: Using Command Prompt

1. Open **Command Prompt** (Win + R → type `cmd` → Enter)
2. Run:
   ```cmd
   ollama pull llama3.2
   ```

### What You'll See:
```
pulling manifest
pulling 8eeb52dfb3bb... 100% ▕████████████████▏ 2.0 GB
pulling 73b313b5552d... 100% ▕████████████████▏ 1.4 KB
pulling 0ba8f0e314b4... 100% ▕████████████████▏  12 KB
pulling 56bb8bd477a5... 100% ▕████████████████▏   96 B
pulling 1a4c3c319823... 100% ▕████████████████▏  485 B
verifying sha256 digest
writing manifest
removing any unused layers
success
```

---

## ✅ Verify Installation

Let's make sure Ollama is working correctly:

### Test 1: Check Ollama Service

```powershell
# Check if Ollama is running
Get-Process | Where-Object {$_.ProcessName -like "*ollama*"}
```

You should see `ollama` in the list.

### Test 2: Test the Model

```powershell
# Test Llama 3.2 with a simple question
ollama run llama3.2 "Hello, are you working?"
```

You should get a response like:
```
Yes, I'm working perfectly! How can I help you today?
```

Press `Ctrl+D` or type `/bye` to exit.

### Test 3: Check Available Models

```powershell
ollama list
```

You should see:
```
NAME            ID              SIZE      MODIFIED
llama3.2:latest abc123def456    2.0 GB    2 minutes ago
```

---

## ⚙️ Configuration

The backend is already configured to use Ollama! Check your `.env` file:

```properties
# AI Configuration
AI_PROVIDER=ollama          # Using Ollama (default)
OLLAMA_URL=http://localhost:11434    # Ollama's default port
OLLAMA_MODEL=llama3.2       # The model we downloaded
```

**No changes needed!** It's already set up correctly.

---

## 🚀 Start Backend

Now let's start the backend server with Ollama support:

### Step 1: Stop Current Backend

If the backend is already running:
```powershell
# Stop all Node processes
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
```

### Step 2: Start Backend

```powershell
cd c:\Users\Admin\vsCodeHacktonWorkspace\Employee360-dashboard\backend-express
node server.js
```

### What You'll See:
```
Connected to MongoDB successfully!
Server is running on http://127.0.0.1:8001
🦙 AI Provider: ollama
🦙 Ollama URL: http://localhost:11434
🦙 Ollama Model: llama3.2
✅ AI Suggestions ready!
```

---

## 🧪 Test AI Suggestions

### Step 1: Open Dashboard

1. Open your browser
2. Go to: **http://localhost:3000**
3. You should see the Dashboard page

### Step 2: Check AI Suggestions Card

Look for the **"AI Suggestions"** section. You should see:

- ✅ **Green "AI" badge** (indicates AI is working)
- ✨ **Title**: "AI-Powered Suggestions"
- 🦙 **Footer**: "Powered by Ollama (llama3.2)" or "Powered by OpenAI GPT-4o-mini"

### Step 3: Check Browser Console

1. Press **F12** to open Developer Tools
2. Click the **"Console"** tab
3. Look for this message:
   ```
   ✨ AI Suggestions Loaded: {
     source: '🤖 OpenAI GPT-4o-mini',
     count: 5,
     timestamp: '10:30:45 AM',
     message: 'Using real AI-powered suggestions!'
   }
   ```

### Step 4: Test Refresh

Click the **"Refresh"** button on the AI Suggestions card. You should see:
- Loading spinner
- New suggestions generated (may be different from before)
- Success message in console

---

## 🔧 Troubleshooting

### Problem 1: "Ollama is not available"

**Symptom**: Error message saying Ollama can't be reached

**Solutions**:
1. Check if Ollama is running:
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -like "*ollama*"}
   ```
   
2. If not running, start it:
   ```powershell
   ollama serve
   ```

3. Verify Ollama is listening:
   ```powershell
   curl http://localhost:11434/api/tags
   ```

### Problem 2: "Model not found"

**Symptom**: Error saying `llama3.2` doesn't exist

**Solution**: Download the model:
```powershell
ollama pull llama3.2
```

### Problem 3: Backend shows "Rule-based suggestions"

**Symptom**: No "AI" badge, using fallback suggestions

**Solutions**:
1. Check `.env` file has `AI_PROVIDER=ollama`
2. Restart backend server
3. Check Ollama is running: `ollama list`
4. Check backend console for error messages

### Problem 4: Slow responses

**Symptom**: AI suggestions take >30 seconds

**Solutions**:
1. First run is always slower (loading model into memory)
2. Subsequent requests should be faster (2-10 seconds)
3. Consider using a smaller model: `ollama pull llama3.2:1b`
4. Close other heavy applications to free up RAM

### Problem 5: Out of memory errors

**Symptom**: Ollama crashes or errors about memory

**Solutions**:
1. Close other applications
2. Use smaller model:
   ```powershell
   ollama pull llama3.2:1b
   ```
   Update `.env`: `OLLAMA_MODEL=llama3.2:1b`

### Problem 6: Port 11434 already in use

**Symptom**: Ollama won't start, port conflict

**Solutions**:
1. Check what's using the port:
   ```powershell
   netstat -ano | findstr :11434
   ```
2. Kill the process or change Ollama's port
3. Update `.env` with new port: `OLLAMA_URL=http://localhost:11435`

---

## 🎯 Advanced Options

### Use Different Models

Ollama supports many models. Here are some alternatives:

#### Smaller & Faster (for less powerful computers):
```powershell
ollama pull llama3.2:1b      # 1.3 GB - Very fast, less capable
ollama pull phi3:mini         # 2.3 GB - Fast, good quality
```

Update `.env`: `OLLAMA_MODEL=llama3.2:1b`

#### Larger & Smarter (for powerful computers):
```powershell
ollama pull llama3.1:8b       # 4.7 GB - Slower, better quality
ollama pull mistral:latest    # 4.1 GB - Good alternative
```

Update `.env`: `OLLAMA_MODEL=llama3.1:8b`

### Change Ollama Port

If port 11434 is taken:

1. Stop Ollama
2. Set environment variable:
   ```powershell
   $env:OLLAMA_HOST="0.0.0.0:11435"
   ollama serve
   ```
3. Update `.env`: `OLLAMA_URL=http://localhost:11435`

### Switch Back to OpenAI

If you later want to use OpenAI instead:

1. Get OpenAI API key from https://platform.openai.com/api-keys
2. Update `.env`:
   ```properties
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-proj-your-key-here
   ```
3. Restart backend

### Monitor Ollama

View running models and memory usage:
```powershell
ollama ps
```

Remove unused models to free disk space:
```powershell
ollama rm llama3.2
```

---

## 📊 Performance Expectations

| Model | Size | Speed | Quality | RAM Needed |
|-------|------|-------|---------|------------|
| llama3.2:1b | 1.3 GB | ⚡ Very Fast (2-5s) | ⭐⭐⭐ Good | 4 GB |
| llama3.2 (3.2b) | 2.0 GB | ⚡ Fast (5-10s) | ⭐⭐⭐⭐ Very Good | 8 GB |
| llama3.1:8b | 4.7 GB | 🐢 Slower (10-20s) | ⭐⭐⭐⭐⭐ Excellent | 16 GB |

**Recommended**: Use `llama3.2` (default) for best balance of speed and quality.

---

## 🆚 Ollama vs OpenAI Comparison

| Feature | Ollama (Local) | OpenAI (Cloud) |
|---------|----------------|----------------|
| **Cost** | 💚 Free forever | 💰 ~$1/month |
| **Privacy** | ✅ 100% local | ⚠️ Data sent to cloud |
| **Speed** | ⚡ 5-10 seconds | ⚡ 2-5 seconds |
| **Quality** | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐⭐⭐ Excellent |
| **Setup** | 🔧 15 minutes | ⚡ 2 minutes |
| **Internet** | ✅ Works offline | ❌ Requires internet |
| **API Key** | ✅ Not needed | ❌ Required |
| **RAM Usage** | 4-8 GB | 0 GB |

---

## 🎓 Learn More

- **Ollama Website**: https://ollama.ai
- **Model Library**: https://ollama.ai/library
- **Llama 3 Info**: https://ai.meta.com/llama/
- **Ollama GitHub**: https://github.com/ollama/ollama
- **Discord Community**: https://discord.gg/ollama

---

## ✅ Quick Checklist

Before testing, make sure you've done all of these:

- [ ] Downloaded and installed Ollama
- [ ] Downloaded llama3.2 model (`ollama pull llama3.2`)
- [ ] Verified Ollama is running (`ollama list`)
- [ ] Checked `.env` has `AI_PROVIDER=ollama`
- [ ] Installed axios (`npm install axios` in backend-express)
- [ ] Restarted backend server
- [ ] Frontend is running on port 3000
- [ ] Opened dashboard and see AI Suggestions card

If all checked, you should see AI-powered suggestions! 🎉

---

## 🆘 Still Need Help?

If you're stuck:

1. **Check the console** (F12 in browser) for error messages
2. **Check backend terminal** for Ollama connection errors
3. **Verify Ollama**: Run `ollama run llama3.2 "test"` in PowerShell
4. **Test API**: `curl http://localhost:11434/api/tags`
5. **Restart everything**: Ollama → Backend → Frontend

---

**Last Updated**: October 12, 2025
**Version**: 1.0
**Author**: GitHub Copilot

🦙 **Enjoy your free, AI-powered productivity suggestions!**
