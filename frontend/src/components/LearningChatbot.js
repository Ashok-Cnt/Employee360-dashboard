import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Fab,
  Fade,
  Chip,
  Tooltip,
  Divider,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Description as PdfIcon,
  TableChart as ExcelIcon,
  Article as WordIcon,
} from '@mui/icons-material';

const LearningChatbot = ({ learningData }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: '👋 Hi! I\'m your Learning Assistant. Ask me about your courses, progress, goals, or statistics!',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportMenuAnchor, setReportMenuAnchor] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8001/api/learning-chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          learningData: learningData,
        }),
      });

      const data = await response.json();

      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: data.response || 'Sorry, I couldn\'t process that request.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: '⚠️ Sorry, I\'m having trouble connecting. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        text: '👋 Chat cleared! How can I help you with your learning progress?',
        timestamp: new Date(),
      }
    ]);
  };

  const handleGenerateReport = async (format) => {
    setReportMenuAnchor(null);
    
    try {
      const response = await fetch(`http://127.0.0.1:8001/api/learning-reports/generate/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          learningData: learningData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learning-progress-${Date.now()}.${format === 'excel' ? 'xlsx' : format === 'word' ? 'docx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Add success message to chat
      const successMessage = {
        id: messages.length + 1,
        type: 'bot',
        text: `✅ Your ${format.toUpperCase()} report has been downloaded successfully!`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, successMessage]);

    } catch (error) {
      console.error('Report generation error:', error);
      const errorMessage = {
        id: messages.length + 1,
        type: 'bot',
        text: `⚠️ Sorry, I couldn't generate the ${format.toUpperCase()} report. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const suggestedQuestions = [
    "📚 Test my knowledge",
    "How am I progressing today?",
    "What's my completion rate?",
    "Show my goals",
  ];

  if (!open) {
    return (
      <Tooltip title="Learning Assistant" placement="left">
        <Fab
          color="primary"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
            },
          }}
        >
          <ChatIcon />
        </Fab>
      </Tooltip>
    );
  }

  return (
    <Fade in={open}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: { xs: '90vw', sm: 420 },
          height: { xs: '70vh', sm: 550 },
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1300,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            🎓 Learning Assistant
          </Typography>
          <Box>
            <Tooltip title="Generate Report">
              <IconButton 
                color="inherit" 
                size="small" 
                onClick={(e) => setReportMenuAnchor(e.currentTarget)}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear chat">
              <IconButton color="inherit" size="small" onClick={handleClearChat}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton color="inherit" size="small" onClick={() => setOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Report Generation Menu */}
        <Menu
          anchorEl={reportMenuAnchor}
          open={Boolean(reportMenuAnchor)}
          onClose={() => setReportMenuAnchor(null)}
        >
          <MenuItem onClick={() => handleGenerateReport('excel')}>
            <ListItemIcon>
              <ExcelIcon fontSize="small" sx={{ color: '#107c41' }} />
            </ListItemIcon>
            <ListItemText>Excel Report</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleGenerateReport('word')}>
            <ListItemIcon>
              <WordIcon fontSize="small" sx={{ color: '#2b579a' }} />
            </ListItemIcon>
            <ListItemText>Word Report</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleGenerateReport('pdf')}>
            <ListItemIcon>
              <PdfIcon fontSize="small" sx={{ color: '#f40f02' }} />
            </ListItemIcon>
            <ListItemText>PDF Report</ListItemText>
          </MenuItem>
        </Menu>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            padding: 2,
            background: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                sx={{
                  padding: 1.5,
                  maxWidth: '80%',
                  bgcolor: message.type === 'user' ? '#667eea' : '#fff',
                  color: message.type === 'user' ? '#fff' : '#000',
                  borderRadius: 2,
                  whiteSpace: 'pre-line',
                }}
              >
                <Typography variant="body2">{message.text}</Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.7,
                    fontSize: '0.7rem',
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Paper>
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Paper sx={{ padding: 1.5, borderRadius: 2 }}>
                <Typography variant="body2">Thinking...</Typography>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Suggested Questions */}
        {messages.length <= 2 && (
          <Box sx={{ padding: 2, paddingTop: 1, background: '#f5f5f5' }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#666' }}>
              Try asking:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {suggestedQuestions.map((question, index) => (
                <Chip
                  key={index}
                  label={question}
                  size="small"
                  onClick={() => setInputMessage(question)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: '#667eea',
                      color: 'white',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider />

        {/* Input */}
        <Box
          sx={{
            padding: 2,
            background: '#fff',
            display: 'flex',
            gap: 1,
            alignItems: 'flex-end',
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Ask about your learning..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || loading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
              '&:disabled': {
                background: '#ccc',
                color: '#999',
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Fade>
  );
};

export default LearningChatbot;
