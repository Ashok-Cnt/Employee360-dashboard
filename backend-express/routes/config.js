const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const ENV_FILE_PATH = path.join(__dirname, '..', '.env');

// Get current configuration
router.get('/', async (req, res) => {
  try {
    const config = {
      aiProvider: process.env.AI_PROVIDER || 'openai',
      openaiEnabled: process.env.AI_PROVIDER === 'openai',
      openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
      ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
      ollamaEnabled: process.env.AI_PROVIDER === 'ollama',
    };

    res.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Update AI provider configuration
router.post('/ai-provider', async (req, res) => {
  try {
    const { provider } = req.body;

    if (!['openai', 'ollama'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider. Must be "openai" or "ollama"' });
    }

    // Read current .env file
    let envContent = '';
    try {
      envContent = await fs.readFile(ENV_FILE_PATH, 'utf8');
    } catch (error) {
      // File doesn't exist, create new content
      envContent = '';
    }

    // Parse existing env variables
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    // Update AI_PROVIDER
    envVars['AI_PROVIDER'] = provider;

    // Rebuild .env content
    const newEnvContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Write back to file
    await fs.writeFile(ENV_FILE_PATH, newEnvContent, 'utf8');

    // Update process.env
    process.env.AI_PROVIDER = provider;

    res.json({
      success: true,
      message: `AI provider switched to ${provider}`,
      config: {
        aiProvider: provider,
        openaiEnabled: provider === 'openai',
        ollamaEnabled: provider === 'ollama',
      }
    });
  } catch (error) {
    console.error('Error updating AI provider:', error);
    res.status(500).json({ error: 'Failed to update AI provider' });
  }
});

// Update OpenAI configuration
router.post('/openai', async (req, res) => {
  try {
    const { apiKey, model } = req.body;

    // Read current .env file
    let envContent = '';
    try {
      envContent = await fs.readFile(ENV_FILE_PATH, 'utf8');
    } catch (error) {
      envContent = '';
    }

    // Parse existing env variables
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    // Update OpenAI settings
    if (apiKey !== undefined) {
      envVars['OPENAI_API_KEY'] = apiKey;
      process.env.OPENAI_API_KEY = apiKey;
    }
    if (model !== undefined) {
      envVars['OPENAI_MODEL'] = model;
      process.env.OPENAI_MODEL = model;
    }

    // Rebuild .env content
    const newEnvContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Write back to file
    await fs.writeFile(ENV_FILE_PATH, newEnvContent, 'utf8');

    res.json({
      success: true,
      message: 'OpenAI configuration updated',
      config: {
        openaiModel: model || process.env.OPENAI_MODEL,
        openaiConfigured: !!(apiKey || process.env.OPENAI_API_KEY),
      }
    });
  } catch (error) {
    console.error('Error updating OpenAI config:', error);
    res.status(500).json({ error: 'Failed to update OpenAI configuration' });
  }
});

// Update Ollama configuration
router.post('/ollama', async (req, res) => {
  try {
    const { host, model } = req.body;

    // Read current .env file
    let envContent = '';
    try {
      envContent = await fs.readFile(ENV_FILE_PATH, 'utf8');
    } catch (error) {
      envContent = '';
    }

    // Parse existing env variables
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    // Update Ollama settings
    if (host !== undefined) {
      envVars['OLLAMA_HOST'] = host;
      process.env.OLLAMA_HOST = host;
    }
    if (model !== undefined) {
      envVars['OLLAMA_MODEL'] = model;
      process.env.OLLAMA_MODEL = model;
    }

    // Rebuild .env content
    const newEnvContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Write back to file
    await fs.writeFile(ENV_FILE_PATH, newEnvContent, 'utf8');

    res.json({
      success: true,
      message: 'Ollama configuration updated',
      config: {
        ollamaHost: host || process.env.OLLAMA_HOST,
        ollamaModel: model || process.env.OLLAMA_MODEL,
      }
    });
  } catch (error) {
    console.error('Error updating Ollama config:', error);
    res.status(500).json({ error: 'Failed to update Ollama configuration' });
  }
});

// Test AI connection
router.post('/test-connection', async (req, res) => {
  try {
    const { provider } = req.body;

    if (provider === 'openai') {
      // Test OpenAI connection
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ 
          success: false, 
          error: 'OpenAI API key not configured' 
        });
      }

      const fetch = (await import('node-fetch')).default;
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });

      if (response.ok) {
        res.json({ 
          success: true, 
          message: 'OpenAI connection successful',
          provider: 'openai'
        });
      } else {
        res.json({ 
          success: false, 
          error: 'OpenAI API key is invalid',
          provider: 'openai'
        });
      }
    } else if (provider === 'ollama') {
      // Test Ollama connection
      const fetch = (await import('node-fetch')).default;
      const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
      
      const response = await fetch(`${ollamaHost}/api/tags`);

      if (response.ok) {
        res.json({ 
          success: true, 
          message: 'Ollama connection successful',
          provider: 'ollama'
        });
      } else {
        res.json({ 
          success: false, 
          error: 'Cannot connect to Ollama server',
          provider: 'ollama'
        });
      }
    } else {
      res.status(400).json({ error: 'Invalid provider' });
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    res.json({ 
      success: false, 
      error: error.message,
      provider: req.body.provider
    });
  }
});

module.exports = router;
