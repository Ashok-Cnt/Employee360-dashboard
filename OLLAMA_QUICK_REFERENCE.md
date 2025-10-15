# 🦙 Ollama Quick Reference Card

## 📥 Installation (First Time Only)

```powershell
# 1. Download Ollama from https://ollama.ai/download
# 2. Install the application
# 3. Pull the AI model
ollama pull llama3.2
```

---

## 🚀 Quick Start

```powershell
# 1. Verify Ollama is working
ollama list

# 2. Start backend (from project root)
cd backend-express
node server.js

# 3. Look for this message:
# 🦙 Using Ollama (llama3.2) at http://localhost:11434

# 4. Open dashboard: http://localhost:3000
```

---

## 🧪 Test Commands

```powershell
# Check if Ollama is running
Get-Process | Where-Object {$_.ProcessName -like "*ollama*"}

# Test Ollama API
curl http://localhost:11434/api/tags

# Test llama3.2 model
ollama run llama3.2 "Hello, test"

# List downloaded models
ollama list
```

---

## 🔧 Common Commands

```powershell
# Start Ollama service (if not running)
ollama serve

# Pull a different model
ollama pull llama3.2:1b        # Smaller, faster

# Remove unused models (free disk space)
ollama rm llama3.2

# View running models
ollama ps

# Stop all models
ollama stop llama3.2
```

---

## 📁 Configuration (.env)

```properties
AI_PROVIDER=ollama                      # Use Ollama
OLLAMA_URL=http://localhost:11434       # Ollama API endpoint
OLLAMA_MODEL=llama3.2                   # Model to use
```

---

## 🔄 Switch Between AI Providers

### To Ollama (Free):
```properties
AI_PROVIDER=ollama
```

### To OpenAI (Paid):
```properties
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key-here
```

**Note**: Restart backend after changing!

---

## ✅ How to Verify It's Working

### In Dashboard:
- ✅ Green "AI" badge on suggestions
- ✅ Title: "AI-Powered Suggestions"
- ✅ Footer: "Powered by Ollama (llama3.2)"

### In Browser Console (F12):
```javascript
✨ AI Suggestions Loaded: {
  source: '🤖 OpenAI GPT-4o-mini',  // Will show Ollama info
  count: 5,
  message: 'Using real AI-powered suggestions!'
}
```

### In Backend Console:
```
🦙 Using Ollama (llama3.2) at http://localhost:11434
```

---

## 🐛 Troubleshooting One-Liners

```powershell
# Problem: "Ollama not available"
ollama serve

# Problem: "Model not found"
ollama pull llama3.2

# Problem: Port already in use
netstat -ano | findstr :11434

# Problem: Slow responses
ollama pull llama3.2:1b    # Use smaller model

# Problem: Backend not connecting
curl http://localhost:11434/api/tags
```

---

## 📊 Model Comparison

| Model | Size | Speed | RAM | Quality |
|-------|------|-------|-----|---------|
| llama3.2:1b | 1.3GB | ⚡⚡⚡ | 4GB | ⭐⭐⭐ |
| llama3.2 | 2.0GB | ⚡⚡ | 8GB | ⭐⭐⭐⭐ |
| llama3.1:8b | 4.7GB | ⚡ | 16GB | ⭐⭐⭐⭐⭐ |

**Recommended**: `llama3.2` (default)

---

## 💡 Pro Tips

1. **First run is slow** - Model loads into memory (~5-10s)
2. **Subsequent runs are fast** - Model stays in memory (~2-5s)
3. **Close other apps** - Frees RAM for better performance
4. **Use smaller model** - If you have <8GB RAM: `llama3.2:1b`
5. **Ollama runs in background** - Check system tray icon

---

## 📚 Full Documentation

- **Complete Guide**: `OLLAMA_SETUP_GUIDE.md`
- **How to Identify AI**: `HOW_TO_IDENTIFY_AI_SUGGESTIONS.md`
- **OpenAI Alternative**: `AI_SUGGESTIONS_SETUP.md`

---

## 🆘 Need Help?

```powershell
# Run the automated setup script
.\setup-ollama.bat

# Or check full guide
code OLLAMA_SETUP_GUIDE.md
```

---

**Last Updated**: October 12, 2025
