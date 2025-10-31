import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Settings,
  CheckCircle,
  Error,
  Refresh,
  Visibility,
  VisibilityOff,
  Psychology,
  Computer,
  Save,
  CloudDone,
} from '@mui/icons-material';

const Configuration = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState(null);
  const [message, setMessage] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Form state
  const [aiProvider, setAiProvider] = useState('openai');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [ollamaHost, setOllamaHost] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.2');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/config');
      const data = await response.json();
      
      setConfig(data);
      setAiProvider(data.aiProvider);
      setOpenaiModel(data.openaiModel);
      setOllamaHost(data.ollamaHost);
      setOllamaModel(data.ollamaModel);
    } catch (error) {
      console.error('Error fetching config:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = async (newProvider) => {
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await fetch('/api/config/ai-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: newProvider }),
      });

      const data = await response.json();

      if (data.success) {
        setAiProvider(newProvider);
        setMessage({ 
          type: 'success', 
          text: `Successfully switched to ${newProvider === 'openai' ? 'OpenAI' : 'Ollama'}` 
        });
        await fetchConfig();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update provider' });
      }
    } catch (error) {
      console.error('Error updating provider:', error);
      setMessage({ type: 'error', text: 'Failed to update AI provider' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOpenAI = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/config/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: openaiApiKey || undefined,
          model: openaiModel,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'OpenAI configuration saved successfully' });
        setOpenaiApiKey(''); // Clear the input
        await fetchConfig();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save configuration' });
      }
    } catch (error) {
      console.error('Error saving OpenAI config:', error);
      setMessage({ type: 'error', text: 'Failed to save OpenAI configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOllama = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/config/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: ollamaHost,
          model: ollamaModel,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Ollama configuration saved successfully' });
        await fetchConfig();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save configuration' });
      }
    } catch (error) {
      console.error('Error saving Ollama config:', error);
      setMessage({ type: 'error', text: 'Failed to save Ollama configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (provider) => {
    try {
      setTesting(true);
      setTestResult(null);

      const response = await fetch('/api/config/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult({ 
        success: false, 
        error: 'Failed to test connection',
        provider 
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Settings sx={{ fontSize: 40, color: '#2196f3' }} />
          <Typography variant="h4">AI Configuration</Typography>
        </Box>
        <Tooltip title="Refresh Configuration">
          <IconButton onClick={fetchConfig} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {testResult && (
        <Alert 
          severity={testResult.success ? 'success' : 'error'} 
          sx={{ mb: 3 }}
          onClose={() => setTestResult(null)}
        >
          {testResult.message || testResult.error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* AI Provider Selection */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              AI Provider Selection
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose which AI service to use for generating insights and suggestions
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    borderColor: aiProvider === 'openai' ? '#2196f3' : 'divider',
                    borderWidth: aiProvider === 'openai' ? 2 : 1,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: 3,
                    }
                  }}
                  onClick={() => handleProviderChange('openai')}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Psychology sx={{ color: '#2196f3' }} />
                        <Typography variant="h6">OpenAI</Typography>
                      </Box>
                      {aiProvider === 'openai' && (
                        <Chip 
                          label="Active" 
                          size="small" 
                          color="primary" 
                          icon={<CheckCircle />} 
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Cloud-based AI using GPT models
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      {config?.openaiConfigured ? (
                        <Chip 
                          label="Configured" 
                          size="small" 
                          color="success" 
                          icon={<CheckCircle />} 
                        />
                      ) : (
                        <Chip 
                          label="Not Configured" 
                          size="small" 
                          color="error" 
                          icon={<Error />} 
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    borderColor: aiProvider === 'ollama' ? '#2196f3' : 'divider',
                    borderWidth: aiProvider === 'ollama' ? 2 : 1,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: 3,
                    }
                  }}
                  onClick={() => handleProviderChange('ollama')}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Computer sx={{ color: '#ff9800' }} />
                        <Typography variant="h6">Ollama</Typography>
                      </Box>
                      {aiProvider === 'ollama' && (
                        <Chip 
                          label="Active" 
                          size="small" 
                          color="primary" 
                          icon={<CheckCircle />} 
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Local AI running on your machine
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Chip 
                        label="Privacy Focused" 
                        size="small" 
                        color="info" 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* OpenAI Configuration */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Psychology sx={{ color: '#2196f3' }} />
              <Typography variant="h6">OpenAI Configuration</Typography>
              {config?.openaiConfigured && (
                <Chip 
                  label="Configured" 
                  size="small" 
                  color="success" 
                  icon={<CloudDone />} 
                />
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key"
                  type={showApiKey ? 'text' : 'password'}
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder={config?.openaiConfigured ? '••••••••••••••••' : 'sk-proj-...'}
                  helperText="Enter your OpenAI API key. Leave empty to keep existing key."
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowApiKey(!showApiKey)}
                          edge="end"
                        >
                          {showApiKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Model"
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  helperText="OpenAI model to use (e.g., gpt-4o-mini, gpt-4)"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSaveOpenAI}
                    disabled={saving}
                  >
                    Save OpenAI Config
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={testing ? <CircularProgress size={20} /> : <CheckCircle />}
                    onClick={() => handleTestConnection('openai')}
                    disabled={testing || !config?.openaiConfigured}
                  >
                    Test Connection
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Ollama Configuration */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Computer sx={{ color: '#ff9800' }} />
              <Typography variant="h6">Ollama Configuration</Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Host URL"
                  value={ollamaHost}
                  onChange={(e) => setOllamaHost(e.target.value)}
                  helperText="Ollama server URL"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Model"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  helperText="Ollama model to use (e.g., llama3.2, mistral)"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSaveOllama}
                    disabled={saving}
                  >
                    Save Ollama Config
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={testing ? <CircularProgress size={20} /> : <CheckCircle />}
                    onClick={() => handleTestConnection('ollama')}
                    disabled={testing}
                  >
                    Test Connection
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Current Status */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Status
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Active Provider:</Typography>
                <Typography variant="h6" sx={{ color: '#2196f3' }}>
                  {config?.aiProvider === 'openai' ? 'OpenAI' : 'Ollama'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">OpenAI Status:</Typography>
                <Chip 
                  label={config?.openaiConfigured ? 'Configured' : 'Not Configured'}
                  color={config?.openaiConfigured ? 'success' : 'default'}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Current Model:</Typography>
                <Typography variant="body1">
                  {config?.aiProvider === 'openai' ? config?.openaiModel : config?.ollamaModel}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Configuration;
