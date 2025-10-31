import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Fab,
  Paper,
  Typography,
  IconButton,
  TextField,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Slide,
  Fade,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { keyframes } from '@mui/system';

// Pulse animation for the FAB
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(33, 150, 243, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
  }
`;

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const [isConfigured, setIsConfigured] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Check if chatbot is configured
  useEffect(() => {
    if (open) {
      checkConfiguration();
    }
  }, [open]);

  const checkConfiguration = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/api/chatbot/health');
      const data = await response.json();
      setIsConfigured(data.configured);
      if (!data.configured) {
        setError('OpenAI API key is not configured. Please add your API key to the .env file.');
      }
    } catch (error) {
      console.error('Failed to check chatbot configuration:', error);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    // Add welcome message on first open
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: '👋 Hello! I\'m your Employee360 assistant. I can help you understand features, troubleshoot issues, and answer questions about the dashboard. What would you like to know?',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleNewConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: '👋 Starting a new conversation! How can I help you today?',
        timestamp: new Date().toISOString(),
      },
    ]);
    setConversationId(null);
    setError(null);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:8001/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationId: conversationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Update conversation ID
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: data.timestamp,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
      // Add error message
      setMessages(prev => [...prev, {
        role: 'error',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    const isError = message.role === 'error';

    return (
      <Fade in key={index} timeout={300}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            mb: 2,
            gap: 1,
          }}
        >
          {!isUser && (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: isError ? '#f44336' : '#2196f3',
              }}
            >
              <BotIcon sx={{ fontSize: 20 }} />
            </Avatar>
          )}
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              maxWidth: '75%',
              bgcolor: isUser ? '#2196f3' : isError ? '#ffebee' : '#f5f5f5',
              color: isUser ? '#fff' : isError ? '#c62828' : '#000',
              borderRadius: 2,
              wordWrap: 'break-word',
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>
          </Paper>
          {isUser && (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#4caf50',
              }}
            >
              <PersonIcon sx={{ fontSize: 20 }} />
            </Avatar>
          )}
        </Box>
      </Fade>
    );
  };

  return (
    <>
      {/* Floating Action Button */}
      <Tooltip title="Ask Employee360 Assistant" placement="left">
        <Fab
          color="primary"
          aria-label="chat"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            animation: !open ? `${pulse} 2s infinite` : 'none',
            zIndex: 1000,
          }}
        >
          <ChatIcon />
        </Fab>
      </Tooltip>

      {/* Chat Window */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 24,
            width: 400,
            height: 600,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BotIcon />
              <Box>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  Employee360 Assistant
                </Typography>
                <Chip
                  icon={<InfoIcon sx={{ fontSize: 12 }} />}
                  label="Powered by OpenAI"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.7rem',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                  }}
                />
              </Box>
            </Box>
            <Box>
              <Tooltip title="New Conversation">
                <IconButton
                  size="small"
                  onClick={handleNewConversation}
                  sx={{ color: 'white', mr: 1 }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton
                size="small"
                onClick={handleClose}
                sx={{ color: 'white' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Configuration Warning */}
          {!isConfigured && (
            <Alert severity="warning" sx={{ borderRadius: 0 }}>
              Configure OpenAI API key in .env file to use the chatbot
            </Alert>
          )}

          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              bgcolor: '#fafafa',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#bdbdbd',
                borderRadius: '4px',
              },
            }}
          >
            {messages.map((message, index) => renderMessage(message, index))}
            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#2196f3' }}>
                  <BotIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    bgcolor: '#f5f5f5',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CircularProgress size={16} />
                  <Typography variant="body2">Thinking...</Typography>
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'white',
              borderTop: '1px solid #e0e0e0',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                inputRef={inputRef}
                fullWidth
                size="small"
                placeholder="Ask about Employee360..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || !isConfigured}
                multiline
                maxRows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading || !isConfigured}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '&:disabled': {
                    bgcolor: '#e0e0e0',
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1, textAlign: 'center' }}
            >
              Press Enter to send, Shift+Enter for new line
            </Typography>
          </Box>
        </Paper>
      </Slide>
    </>
  );
};

export default Chatbot;
