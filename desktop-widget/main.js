const { app, BrowserWindow, shell, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
const configPath = path.join(app.getPath('userData'), 'widget-config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      // Always use fixed size - ignore saved size
      config.size = 80; // Smaller, more compact size
      return config;
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return { x: undefined, y: undefined, size: 80 }; // Smaller, more compact size
}

function saveConfig(config) {
  try {
    const existingConfig = loadConfig();
    const newConfig = { ...existingConfig, ...config };
    // Always enforce fixed size - never save size changes
    newConfig.size = 80;
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

function createWindow() {
  const config = loadConfig();
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  
  const size = 80; // Smaller, more compact size
  
  // Default position: bottom-right corner
  const defaultX = screenWidth - size - 20;
  const defaultY = screenHeight - size - 20;
  
  win = new BrowserWindow({
    width: size,
    height: size,
    x: config.x !== undefined ? config.x : defaultX,
    y: config.y !== undefined ? config.y : defaultY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    hasShadow: false,
    opacity: 1.0,
    show: true, // Show immediately
    backgroundColor: '#00000000',
  });

  win.loadFile('widget.html');
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true);
  win.setSkipTaskbar(false);
  win.setIgnoreMouseEvents(false);
  
  // Open DevTools for debugging (Ctrl+Shift+I)
  win.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  });
  
  // Force show after a delay
  setTimeout(() => {
    if (win && !win.isDestroyed()) {
      win.show();
      win.focus();
      win.moveTop();
    }
  }, 500);

  // Save position when moved
  win.on('moved', () => {
    const bounds = win.getBounds();
    // Ensure size hasn't changed
    if (bounds.width !== 80 || bounds.height !== 80) {
      win.setSize(80, 80, false);
    }
    saveConfig({ x: bounds.x, y: bounds.y });
  });

  win.on('close', (e) => {
    e.preventDefault();
    console.log('Window close prevented');
    win.hide();
    setTimeout(() => {
      if (win && !win.isDestroyed()) {
        win.show();
      }
    }, 100);
  });

  win.on('closed', () => {
    console.log('Window closed event');
  });

  // Prevent widget from closing when opening external links
  win.on('blur', () => {
    if (win) {
      setTimeout(() => {
        if (win && !win.isDestroyed()) {
          win.show();
          win.setAlwaysOnTop(true, 'screen-saver');
        }
      }, 100);
    }
  });
}

// Handle drag start
ipcMain.on('start-drag', (event) => {
  if (win) {
    const mousePos = require('electron').screen.getCursorScreenPoint();
    const winPos = win.getPosition();
    
    // Calculate offset from window position to mouse
    const offsetX = mousePos.x - winPos[0];
    const offsetY = mousePos.y - winPos[1];
    
    // Store offset for dragging
    win.dragOffset = { x: offsetX, y: offsetY };
  }
});

// Handle dragging
ipcMain.on('dragging', (event) => {
  if (win && win.dragOffset) {
    const mousePos = require('electron').screen.getCursorScreenPoint();
    const newX = mousePos.x - win.dragOffset.x;
    const newY = mousePos.y - win.dragOffset.y;
    
    // Ensure size stays at 80px
    win.setSize(80, 80, false);
    win.setPosition(newX, newY, false);
  }
});

// Handle drag end
ipcMain.on('end-drag', (event) => {
  if (win) {
    win.dragOffset = null;
    const bounds = win.getBounds();
    saveConfig({ x: bounds.x, y: bounds.y });
  }
});

// Handle animation change
ipcMain.on('change-animation', (event, animationType) => {
  saveConfig({ animation: animationType });
  if (win) {
    win.webContents.send('set-animation', animationType);
  }
});

// Handle notification update
ipcMain.on('update-notification', (event, count) => {
  if (win) {
    win.webContents.send('show-notification', count);
  }
});

// Handle request for saved animation
ipcMain.on('get-saved-animation', (event) => {
  const config = loadConfig();
  const savedAnimation = config.animation || 'employee360';
  event.sender.send('load-animation', savedAnimation);
});

// Handle right-click to show animation menu
ipcMain.on('show-animation-menu', (event) => {
  const config = loadConfig();
  const currentAnimation = config.animation || 'employee360';
  
  const menu = Menu.buildFromTemplate([
    {
      label: 'Change Animation',
      enabled: false
    },
    { type: 'separator' },
    {
      label: '🎯 Employee 360',
      type: 'radio',
      checked: currentAnimation === 'employee360',
      click: () => {
        event.sender.send('set-animation', 'employee360');
        saveConfig({ animation: 'employee360' });
      }
    },
    {
      label: '🤖 Robot Face',
      type: 'radio',
      checked: currentAnimation === 'robot',
      click: () => {
        event.sender.send('set-animation', 'robot');
        saveConfig({ animation: 'robot' });
      }
    },
    {
      label: '⚡ Lightning',
      type: 'radio',
      checked: currentAnimation === 'lightning',
      click: () => {
        event.sender.send('set-animation', 'lightning');
        saveConfig({ animation: 'lightning' });
      }
    },
    {
      label: '💗 Heartbeat',
      type: 'radio',
      checked: currentAnimation === 'heartbeat',
      click: () => {
        event.sender.send('set-animation', 'heartbeat');
        saveConfig({ animation: 'heartbeat' });
      }
    },
    {
      label: '� Radar',
      type: 'radio',
      checked: currentAnimation === 'radar',
      click: () => {
        event.sender.send('set-animation', 'radar');
        saveConfig({ animation: 'radar' });
      }
    },
    {
      label: '⭐ Stars',
      type: 'radio',
      checked: currentAnimation === 'stars',
      click: () => {
        event.sender.send('set-animation', 'stars');
        saveConfig({ animation: 'stars' });
      }
    }
  ]);
  
  menu.popup();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', (e) => {
  // Prevent app from quitting
  e.preventDefault();
  console.log('Window close prevented - keeping app alive');
});

app.on('activate', () => {
  if (win === null) createWindow();
});

app.on('before-quit', (e) => {
  console.log('App trying to quit...');
});
