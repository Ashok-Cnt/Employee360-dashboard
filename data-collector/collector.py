import asyncio
import logging
import os
import psutil
import time
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import platform
import ctypes
from ctypes import wintypes
import random
import configparser
import getpass
from collections import defaultdict

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Application Categories
APP_CATEGORIES = {
    'productivity': [
        'Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Microsoft Outlook',
        'Microsoft OneNote', 'Adobe Acrobat', 'Notepad++', 'Sublime Text', 'Atom',
        'Google Docs', 'Evernote', 'Notion'
    ],
    'development': [
        'Visual Studio Code', 'Visual Studio', 'JetBrains Rider', 'IntelliJ IDEA',
        'PyCharm', 'WebStorm', 'Android Studio', 'Xcode', 'Eclipse',
        'MongoDB Compass', 'MySQL', 'PostgreSQL', 'Postman', 'Insomnia',
        'Git', 'GitHub Desktop', 'Sourcetree'
    ],
    'communication': [
        'Microsoft Teams', 'Slack', 'Discord', 'Zoom', 'Skype', 'WhatsApp',
        'Telegram', 'Microsoft Outlook', 'Gmail', 'Thunderbird'
    ],
    'media': [
        'Spotify', 'VLC Media Player', 'Netflix', 'YouTube', 'iTunes', 'Winamp',
        'Adobe Photoshop', 'Adobe Illustrator', 'Adobe Premiere Pro', 'Adobe After Effects',
        'GIMP', 'Audacity', 'OBS Studio'
    ],
    'browsers': [
        'Google Chrome', 'Mozilla Firefox', 'Microsoft Edge', 'Opera Browser',
        'Brave Browser', 'Safari', 'Vivaldi'
    ],
    'utilities': [
        'File Explorer', 'Notepad', 'Calculator', 'Task Manager', '7-Zip', 'WinRAR',
        'PuTTY', 'FileZilla', 'Wireshark'
    ],
    'non-work': [
        'Steam', 'EA Origin', 'Epic Games Launcher', 'Battle.net', 'Xbox',
        'Facebook', 'Instagram', 'Twitter', 'Reddit', 'TikTok'
    ]
}

# Focus vs Distraction Apps
FOCUS_APPS = [
    'Visual Studio Code', 'Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint',
    'JetBrains Rider', 'IntelliJ IDEA', 'PyCharm', 'WebStorm', 'Adobe Photoshop',
    'Adobe Illustrator', 'MongoDB Compass', 'Postman'
]

DISTRACTION_APPS = [
    'Facebook', 'Instagram', 'Twitter', 'Reddit', 'TikTok', 'YouTube',
    'Netflix', 'Steam', 'Discord', 'WhatsApp', 'Telegram'
]

class ApplicationDataCollector:
    def __init__(self):
        self.mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
        self.database_name = os.getenv('DATABASE_NAME', 'employee360')
        self.collection_interval = int(os.getenv('COLLECTION_INTERVAL_SECONDS', 30))
        # Get the current logged-in user, fallback to environment variable or default
        self.user_id = os.getenv('USER_ID', getpass.getuser())
        self.client = None
        self.db = None
        
        # Session tracking for focus time calculation
        self.session_start_time = datetime.utcnow()
        self.current_focused_app = None
        self.focused_app_start_time = None
        self.daily_tracking = defaultdict(lambda: {
            'total_time': 0,
            'focus_time': 0,
            'distraction_time': 0,
            'apps': defaultdict(lambda: {
                'total_time': 0,
                'category': 'uncategorized',
                'is_focus': False,
                'is_distraction': False
            })
        })
        
        # Load configuration
        self.config = configparser.ConfigParser()
        config_path = os.path.join(os.path.dirname(__file__), 'config.ini')
        
        if os.path.exists(config_path):
            self.config.read(config_path)
            logger.info(f"Loaded configuration from {config_path}")
        else:
            logger.warning(f"Configuration file not found at {config_path}, using defaults")
            # Set default configuration
            self.config.add_section('tracking_enabled')
            self.config.set('tracking_enabled', 'enabled', 'true')
            self.config.set('tracking_enabled', 'max_applications', '50')
        
        # Windows API for getting foreground window
        if platform.system() == 'Windows':
            self.user32 = ctypes.windll.user32
            self.kernel32 = ctypes.windll.kernel32
    
    async def connect_to_database(self):
        """Connect to MongoDB database"""
        try:
            self.client = AsyncIOMotorClient(self.mongodb_uri)
            self.db = self.client[self.database_name]
            # Test connection
            await self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {self.database_name}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def get_foreground_window_info(self):
        """Get information about the currently focused window (Windows only)"""
        if platform.system() != 'Windows':
            return None, None
        
        try:
            # Get foreground window handle
            hwnd = self.user32.GetForegroundWindow()
            if not hwnd:
                return None, None
            
            # Get window title
            length = self.user32.GetWindowTextLengthW(hwnd)
            buff = ctypes.create_unicode_buffer(length + 1)
            self.user32.GetWindowTextW(hwnd, buff, length + 1)
            window_title = buff.value
            
            # Get process ID
            pid = wintypes.DWORD()
            self.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            
            # Get process name
            try:
                process = psutil.Process(pid.value)
                process_name = process.name()
                return process_name, window_title
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                return None, window_title
                
        except Exception as e:
            logger.warning(f"Error getting foreground window: {e}")
            return None, None
    
    def get_friendly_app_name(self, process_name, window_title=None):
        """Convert process name to user-friendly application name"""
        process_name_lower = process_name.lower()
        
        # Application name mapping
        app_name_map = {
            # Microsoft Office
            'winword.exe': 'Microsoft Word',
            'excel.exe': 'Microsoft Excel',
            'powerpnt.exe': 'Microsoft PowerPoint',
            'outlook.exe': 'Microsoft Outlook',
            'onenote.exe': 'Microsoft OneNote',
            'teams.exe': 'Microsoft Teams',
            
            # Browsers
            'chrome.exe': 'Google Chrome',
            'firefox.exe': 'Mozilla Firefox',
            'msedge.exe': 'Microsoft Edge',
            'opera.exe': 'Opera Browser',
            'brave.exe': 'Brave Browser',
            'iexplore.exe': 'Internet Explorer',
            
            # Development Tools
            'code.exe': 'Visual Studio Code',
            'devenv.exe': 'Visual Studio',
            'rider64.exe': 'JetBrains Rider',
            'idea64.exe': 'IntelliJ IDEA',
            'pycharm64.exe': 'PyCharm',
            'webstorm64.exe': 'WebStorm',
            'sublime_text.exe': 'Sublime Text',
            'notepad++.exe': 'Notepad++',
            'atom.exe': 'Atom',
            
            # Communication
            'slack.exe': 'Slack',
            'discord.exe': 'Discord',
            'zoom.exe': 'Zoom',
            'skype.exe': 'Skype',
            'whatsapp.exe': 'WhatsApp',
            'telegram.exe': 'Telegram',
            
            # Media & Entertainment
            'spotify.exe': 'Spotify',
            'vlc.exe': 'VLC Media Player',
            'netflix.exe': 'Netflix',
            'youtube.exe': 'YouTube',
            'itunes.exe': 'iTunes',
            'winamp.exe': 'Winamp',
            
            # Adobe Creative Suite
            'photoshop.exe': 'Adobe Photoshop',
            'illustrator.exe': 'Adobe Illustrator',
            'indesign.exe': 'Adobe InDesign',
            'lightroom.exe': 'Adobe Lightroom',
            'premiere.exe': 'Adobe Premiere Pro',
            'afterfx.exe': 'Adobe After Effects',
            'acrobat.exe': 'Adobe Acrobat',
            
            # System & Utilities
            'explorer.exe': 'File Explorer',
            'notepad.exe': 'Notepad',
            'calc.exe': 'Calculator',
            'cmd.exe': 'Command Prompt',
            'powershell.exe': 'PowerShell',
            'taskmgr.exe': 'Task Manager',
            'regedit.exe': 'Registry Editor',
            'msconfig.exe': 'System Configuration',
            
            # Gaming
            'steam.exe': 'Steam',
            'origin.exe': 'EA Origin',
            'epicgameslauncher.exe': 'Epic Games Launcher',
            'battle.net.exe': 'Battle.net',
            
            # Cloud Storage
            'onedrive.exe': 'OneDrive',
            'dropbox.exe': 'Dropbox',
            'googledrivesync.exe': 'Google Drive',
            'box.exe': 'Box',
            
            # Database & Development
            'mongodbcompass.exe': 'MongoDB Compass',
            'mysql.exe': 'MySQL',
            'postgres.exe': 'PostgreSQL',
            'redis.exe': 'Redis',
            'postman.exe': 'Postman',
            'insomnia.exe': 'Insomnia',
            
            # Others
            '7z.exe': '7-Zip',
            'winrar.exe': 'WinRAR',
            'putty.exe': 'PuTTY',
            'filezilla.exe': 'FileZilla',
            'wireshark.exe': 'Wireshark',
            'vmware.exe': 'VMware',
            'virtualbox.exe': 'VirtualBox'
        }
        
        # Check if we have a friendly name mapping
        if process_name_lower in app_name_map:
            return app_name_map[process_name_lower]
        
        # If no mapping found, use the process name without .exe extension
        if process_name_lower.endswith('.exe'):
            clean_name = process_name[:-4]  # Remove .exe
        else:
            clean_name = process_name
        
        # Capitalize the first letter of each word
        return ' '.join(word.capitalize() for word in clean_name.replace('_', ' ').replace('-', ' ').split())
    
    def get_app_category(self, app_name):
        """Determine the category of an application"""
        for category, apps in APP_CATEGORIES.items():
            if app_name in apps:
                return category
        return 'uncategorized'
    
    def is_focus_app(self, app_name):
        """Check if application is a focus application"""
        return app_name in FOCUS_APPS
    
    def is_distraction_app(self, app_name):
        """Check if application is a distraction"""
        return app_name in DISTRACTION_APPS
    
    def get_running_applications(self):
        """Get list of running applications with their total memory usage - matching Task Manager"""
        applications = {}
        apps_with_windows = set()
        
        # First pass: identify which applications have visible windows
        for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'cpu_percent', 'exe']):
            try:
                info = proc.info
                name = info['name']
                pid = info['pid']
                
                # Skip system processes and focus on user applications
                if self.is_user_application(proc, info):
                    # Calculate memory first to check thresholds
                    try:
                        # Use USS (Unique Set Size) which matches Task Manager better
                        full_mem_info = proc.memory_full_info()
                        memory_mb = full_mem_info.uss / (1024 * 1024)
                    except (psutil.AccessDenied, AttributeError):
                        # Fallback to RSS if USS is not available
                        memory_mb = info['memory_info'].rss / (1024 * 1024) if info['memory_info'] else 0
                    
                    # Check if this application should be tracked based on configuration
                    if self.should_track_application(name, memory_mb):
                        # Check if this process has a visible window
                        if self.has_visible_window(pid):
                            apps_with_windows.add(name)
                        
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
        
        # Second pass: aggregate all processes for applications that have at least one visible window
        for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'cpu_percent', 'exe']):
            try:
                info = proc.info
                name = info['name']
                pid = info['pid']
                
                # Skip system processes and focus on user applications
                if self.is_user_application(proc, info):
                    # Include this process if the application has at least one visible window
                    if name in apps_with_windows:
                        # Use the process name as the key for aggregation
                        app_key = name
                        
                        if app_key not in applications:
                            applications[app_key] = {
                                'name': name,
                                'memory_mb': 0,
                                'cpu_percent': 0,
                                'process_count': 0,
                                'pids': []
                            }
                        
                        # Get memory usage (USS = Unique Set Size, matches Task Manager's "Memory" column)
                        try:
                            # Use USS (Unique Set Size) which matches Task Manager better
                            full_mem_info = proc.memory_full_info()
                            memory_mb = full_mem_info.uss / (1024 * 1024)
                        except (psutil.AccessDenied, AttributeError):
                            # Fallback to RSS if USS is not available
                            memory_mb = info['memory_info'].rss / (1024 * 1024) if info['memory_info'] else 0
                        cpu_percent = info['cpu_percent'] or 0
                        
                        applications[app_key]['memory_mb'] += memory_mb
                        applications[app_key]['cpu_percent'] += cpu_percent
                        applications[app_key]['process_count'] += 1
                        applications[app_key]['pids'].append(info['pid'])
                    
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
        
        # Average CPU usage for multi-process applications
        for app in applications.values():
            if app['process_count'] > 1:
                app['cpu_percent'] /= app['process_count']
        
        return list(applications.values())
    
    def is_user_application(self, proc, info):
        """Determine if a process is a user application that should appear in taskbar"""
        try:
            name = info['name'].lower()
            
            # Exclude specific system and background processes
            excluded_processes = {
                'system', 'registry', 'smss.exe', 'csrss.exe', 'wininit.exe', 
                'winlogon.exe', 'services.exe', 'lsass.exe', 'lsm.exe', 'svchost.exe',
                'dwm.exe', 'explorer.exe', 'audiodg.exe', 'spoolsv.exe', 'taskhost.exe',
                'taskhostw.exe', 'conhost.exe', 'rundll32.exe', 'dllhost.exe',
                'msdtc.exe', 'wuauclt.exe', 'searchindexer.exe', 'wmiprvse.exe',
                # Background services that don't have taskbar presence
                'afwserv.exe', 'avgsvc.exe', 'avgtools.exe', 'avgtoolssvc.exe',
                'aswengserv.exe', 'aswidsagent.exe', 'mongod.exe',
                'filecoauth.exe', 'adobecollabsync.exe', 'cortana.exe',
                'lockapp.exe', 'startmenuexperiencehost.exe', 'searchapp.exe',
                'systemsettings.exe', 'msedgewebview2.exe',
                # Dell services and background apps
                'dell.techhub.exe', 'dell.techhub.diagnostics.subagent.exe',
                'dell.techhub.datamanager.subagent.exe', 'dell.coreservices.client.exe',
                'dell.update.subagent.exe', 'dell.techhub.instrumentation.userprocess.exe',
                'supportassistagent.exe', 'serviceshell.exe', 'pwrisovm.exe',
                'video.ui.exe', 'mcupdatermodule.exe', 'avgui.exe', 'wsc_proxy.exe',
                'wslservice.exe', 'armsvc.exe'
            }
            
            # Skip excluded processes
            if name in excluded_processes:
                return False
            
            # Skip processes without executable path (usually system processes)
            if not info.get('exe'):
                return False
            
            exe_path = info.get('exe', '').lower()
            
            # Special cases for system tools that users commonly use
            user_system_tools = ['notepad.exe', 'calc.exe', 'mspaint.exe', 'wordpad.exe']
            if name in user_system_tools:
                return True
            
            # Skip Windows system directories (except for special cases above)
            if any(sys_dir in exe_path for sys_dir in [
                'c:\\windows\\system32\\', 'c:\\windows\\syswow64\\',
                'c:\\windows\\winsxs\\', 'c:\\windows\\servicing\\',
                'c:\\windows\\sysnative\\'
            ]):
                return False
            
            # Only include applications from known user application directories
            user_app_dirs = [
                'c:\\program files\\', 'c:\\program files (x86)\\',
                'c:\\users\\', '\\appdata\\local\\programs\\',
                '\\appdata\\roaming\\', '\\desktop\\', '\\downloads\\'
            ]
            
            # Must be in a user application directory
            if not any(app_dir in exe_path for app_dir in user_app_dirs):
                return False
            
            # Must be an executable
            if not name.endswith('.exe'):
                return False
                
            return True
            
        except Exception:
            return False
    
    def should_track_application(self, process_name, memory_mb=0):
        """Check if application should be tracked based on configuration"""
        try:
            # Check if tracking is enabled
            if not self.config.getboolean('tracking_enabled', 'enabled', fallback=True):
                return False
            
            # Check memory threshold
            min_memory = self.config.getfloat('memory_thresholds', 'minimum_memory_mb', fallback=10)
            if memory_mb < min_memory:
                return False
            
            # Remove .exe extension for checking
            clean_name = process_name.lower().replace('.exe', '')
            
            # Check exclusions first
            if self.config.has_section('exclusions'):
                excluded = self.config.get('exclusions', 'excluded_processes', fallback='')
                if excluded:
                    excluded_list = [item.strip() for item in excluded.split(',')]
                    if clean_name in [ex.lower() for ex in excluded_list]:
                        return False
            
            # Check specific applications
            if self.config.has_section('specific_applications'):
                if self.config.has_option('specific_applications', clean_name):
                    return self.config.getboolean('specific_applications', clean_name, fallback=True)
            
            # If not specifically configured, allow by default
            return True
            
        except Exception as e:
            logger.warning(f"Error checking application config for {process_name}: {e}")
            return True  # Default to allowing if config check fails
    
    def has_visible_window(self, pid):
        """Check if a process has a visible window that would appear in taskbar"""
        try:
            # Windows API constants
            WS_VISIBLE = 0x10000000
            WS_EX_TOOLWINDOW = 0x00000080
            WS_EX_APPWINDOW = 0x00040000
            GWL_EXSTYLE = -20
            GWL_STYLE = -16
            
            # Get user32 and kernel32 DLLs
            user32 = ctypes.windll.user32
            
            # Variable to store if we found a visible window
            found_window = [False]
            
            # Check if any window belongs to this process and is visible
            def enum_windows_proc(hwnd, lParam):
                # Get window's process ID
                window_pid = wintypes.DWORD()
                user32.GetWindowThreadProcessId(hwnd, ctypes.byref(window_pid))
                
                if window_pid.value == pid:
                    # Check if window is visible
                    if user32.IsWindowVisible(hwnd):
                        # Get window styles
                        style = user32.GetWindowLongW(hwnd, GWL_STYLE)
                        ex_style = user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
                        
                        # Check if it's a regular window (not a tool window)
                        # and is visible in taskbar
                        is_tool_window = (ex_style & WS_EX_TOOLWINDOW) != 0
                        is_app_window = (ex_style & WS_EX_APPWINDOW) != 0
                        is_visible = (style & WS_VISIBLE) != 0
                        
                        # Get window title length
                        title_length = user32.GetWindowTextLengthW(hwnd)
                        
                        # Window should appear in taskbar if:
                        # - It's visible
                        # - It has a title
                        # - It's not a tool window OR it's explicitly an app window
                        if is_visible and title_length > 0 and (not is_tool_window or is_app_window):
                            found_window[0] = True
                            return False  # Stop enumeration
                
                return True  # Continue enumeration
            
            # Define the callback type
            EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
            
            # Enumerate all windows
            user32.EnumWindows(EnumWindowsProc(enum_windows_proc), 0)
            
            return found_window[0]
            
        except Exception as e:
            # If we can't determine, assume it might have a window
            return True
    
    def is_application(self, process_name):
        """Legacy method - keeping for compatibility"""
        # This method is now replaced by is_user_application but keeping for compatibility
        return True
    
    def get_actual_resource_usage(self, app_name, app_data):
        """Get actual resource usage without artificial variations"""
        # Return the real memory and CPU usage as reported by the system
        return round(app_data['memory_mb'], 2), round(app_data['cpu_percent'], 2)
    
    async def collect_and_store_data(self):
        """Collect application data and store in MongoDB with enhanced tracking"""
        try:
            current_time = datetime.utcnow()
            current_date = current_time.date()
            current_hour = current_time.hour
            
            # Get foreground window information
            foreground_app, window_title = self.get_foreground_window_info()
            
            # Get all currently running applications
            running_applications = self.get_running_applications()
            
            # Get system metrics
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            memory_usage_mb = memory.used / (1024 * 1024)
            
            # Track focused app time
            if foreground_app:
                friendly_app_name = self.get_friendly_app_name(foreground_app)
                
                # If app changed, save previous app's focus time
                if self.current_focused_app != friendly_app_name:
                    if self.current_focused_app and self.focused_app_start_time:
                        focus_duration = (current_time - self.focused_app_start_time).total_seconds()
                        await self.update_app_time_tracking(
                            self.current_focused_app,
                            focus_duration,
                            current_date,
                            current_hour,
                            is_focused=True
                        )
                    
                    # Start tracking new app
                    self.current_focused_app = friendly_app_name
                    self.focused_app_start_time = current_time
            
            # Process all running applications
            app_activities = []
            for app in running_applications:
                original_app_name = app['name'].replace('.exe', '')
                friendly_app_name = self.get_friendly_app_name(app['name'])
                
                is_focused = (foreground_app and app['name'] == foreground_app)
                memory_mb, cpu_percent = self.get_actual_resource_usage(original_app_name, app)
                
                # Get app categorization
                category = self.get_app_category(friendly_app_name)
                is_focus = self.is_focus_app(friendly_app_name)
                is_distraction = self.is_distraction_app(friendly_app_name)
                
                # Real-time activity document (current state)
                activity_document = {
                    'user_id': self.user_id,
                    'application': friendly_app_name,
                    'process_name': original_app_name,
                    'window_title': window_title if is_focused else friendly_app_name,
                    'category': category,
                    'is_focus_app': is_focus,
                    'is_distraction_app': is_distraction,
                    'timestamp': current_time,
                    'duration_seconds': self.collection_interval,
                    'memory_usage_mb': memory_mb,
                    'cpu_usage_percent': cpu_percent,
                    'is_active': True,
                    'is_focused': is_focused,
                    'last_seen': current_time,
                    'process_count': app.get('process_count', 1),
                    'pids': app.get('pids', [])
                }
                
                app_activities.append(activity_document)
                
                # Update time-based tracking for background apps
                if not is_focused:
                    await self.update_app_time_tracking(
                        friendly_app_name,
                        self.collection_interval,
                        current_date,
                        current_hour,
                        is_focused=False
                    )
            
            # Batch insert real-time activity
            if app_activities:
                await self.db.application_activity.insert_many(app_activities)
            
            # Store system metrics
            await self.store_system_metrics(current_time, cpu_usage, memory_usage_mb)
            
            # Store daily summary
            await self.store_daily_summary(current_date)
            
            # Store hourly summary
            await self.store_hourly_summary(current_date, current_hour)
            
            # Log status
            if foreground_app:
                focused_friendly_name = self.get_friendly_app_name(foreground_app)
                category = self.get_app_category(focused_friendly_name)
                logger.info(f"Focused: {focused_friendly_name} ({category}) | Running: {len(running_applications)} | CPU: {cpu_usage:.1f}% | Memory: {memory_usage_mb:.0f}MB")
            else:
                logger.info(f"No focused app | Running: {len(running_applications)} | CPU: {cpu_usage:.1f}% | Memory: {memory_usage_mb:.0f}MB")
            
            # Cleanup old real-time data (keep only last 24 hours)
            cleanup_time = current_time - timedelta(hours=24)
            await self.db.application_activity.delete_many({
                'timestamp': {'$lt': cleanup_time}
            })
                
        except Exception as e:
            logger.error(f"Error collecting application data: {e}", exc_info=True)
    
    async def update_app_time_tracking(self, app_name, duration_seconds, date, hour, is_focused=False):
        """Update time tracking for an application"""
        try:
            category = self.get_app_category(app_name)
            is_focus = self.is_focus_app(app_name)
            is_distraction = self.is_distraction_app(app_name)
            
            # Prepare update document
            update_doc = {
                '$inc': {
                    'total_time_seconds': duration_seconds,
                    'focused_time_seconds': duration_seconds if is_focused else 0,
                    'background_time_seconds': duration_seconds if not is_focused else 0,
                },
                '$set': {
                    'user_id': self.user_id,
                    'application': app_name,
                    'category': category,
                    'is_focus_app': is_focus,
                    'is_distraction_app': is_distraction,
                    'date': datetime.combine(date, datetime.min.time()),
                    'hour': hour,
                    'last_updated': datetime.utcnow()
                }
            }
            
            # Update app time tracking (hourly granularity)
            await self.db.app_time_tracking.update_one(
                {
                    'user_id': self.user_id,
                    'application': app_name,
                    'date': datetime.combine(date, datetime.min.time()),
                    'hour': hour
                },
                update_doc,
                upsert=True
            )
            
        except Exception as e:
            logger.error(f"Error updating app time tracking: {e}")
    
    async def store_system_metrics(self, timestamp, cpu_usage, memory_usage_mb):
        """Store system-level metrics"""
        try:
            metrics_doc = {
                'user_id': self.user_id,
                'timestamp': timestamp,
                'date': datetime.combine(timestamp.date(), datetime.min.time()),
                'hour': timestamp.hour,
                'cpu_usage_percent': cpu_usage,
                'memory_usage_mb': memory_usage_mb,
            }
            
            await self.db.system_metrics.insert_one(metrics_doc)
            
            # Cleanup old metrics (keep only last 7 days)
            cleanup_time = timestamp - timedelta(days=7)
            await self.db.system_metrics.delete_many({
                'timestamp': {'$lt': cleanup_time}
            })
            
        except Exception as e:
            logger.error(f"Error storing system metrics: {e}")
    
    async def store_daily_summary(self, date):
        """Store or update daily summary with focus vs distraction time"""
        try:
            date_start = datetime.combine(date, datetime.min.time())
            date_end = date_start + timedelta(days=1)
            
            # Aggregate app time tracking for the day
            pipeline = [
                {
                    '$match': {
                        'user_id': self.user_id,
                        'date': date_start
                    }
                },
                {
                    '$group': {
                        '_id': None,
                        'total_time_seconds': {'$sum': '$total_time_seconds'},
                        'total_focused_time_seconds': {'$sum': '$focused_time_seconds'},
                        'apps': {
                            '$push': {
                                'application': '$application',
                                'total_time_seconds': '$total_time_seconds',
                                'focused_time_seconds': '$focused_time_seconds',
                                'category': '$category',
                                'is_focus_app': '$is_focus_app',
                                'is_distraction_app': '$is_distraction_app'
                            }
                        }
                    }
                }
            ]
            
            result = await self.db.app_time_tracking.aggregate(pipeline).to_list(length=1)
            
            if result:
                data = result[0]
                apps = data.get('apps', [])
                
                # Calculate focus and distraction time
                focus_time = sum(app['focused_time_seconds'] for app in apps if app.get('is_focus_app', False))
                distraction_time = sum(app['total_time_seconds'] for app in apps if app.get('is_distraction_app', False))
                
                # Calculate category breakdown
                category_breakdown = {}
                for app in apps:
                    category = app.get('category', 'uncategorized')
                    if category not in category_breakdown:
                        category_breakdown[category] = 0
                    category_breakdown[category] += app['total_time_seconds']
                
                # Get top apps
                top_apps = sorted(apps, key=lambda x: x['total_time_seconds'], reverse=True)[:10]
                
                # Get system metrics for the day
                avg_cpu = await self.get_average_system_metric('cpu_usage_percent', date_start, date_end)
                avg_memory = await self.get_average_system_metric('memory_usage_mb', date_start, date_end)
                
                # Store daily summary
                summary_doc = {
                    'user_id': self.user_id,
                    'date': date_start,
                    'total_time_seconds': data['total_time_seconds'],
                    'total_focused_time_seconds': data['total_focused_time_seconds'],
                    'focus_time_seconds': focus_time,
                    'distraction_time_seconds': distraction_time,
                    'category_breakdown': category_breakdown,
                    'top_apps': top_apps,
                    'avg_cpu_usage_percent': avg_cpu,
                    'avg_memory_usage_mb': avg_memory,
                    'last_updated': datetime.utcnow()
                }
                
                await self.db.daily_summary.update_one(
                    {
                        'user_id': self.user_id,
                        'date': date_start
                    },
                    {'$set': summary_doc},
                    upsert=True
                )
                
        except Exception as e:
            logger.error(f"Error storing daily summary: {e}")
    
    async def store_hourly_summary(self, date, hour):
        """Store or update hourly summary"""
        try:
            date_start = datetime.combine(date, datetime.min.time())
            
            # Aggregate app time tracking for the hour
            pipeline = [
                {
                    '$match': {
                        'user_id': self.user_id,
                        'date': date_start,
                        'hour': hour
                    }
                },
                {
                    '$group': {
                        '_id': None,
                        'total_time_seconds': {'$sum': '$total_time_seconds'},
                        'total_focused_time_seconds': {'$sum': '$focused_time_seconds'},
                        'apps': {
                            '$push': {
                                'application': '$application',
                                'total_time_seconds': '$total_time_seconds',
                                'category': '$category',
                                'is_focus_app': '$is_focus_app',
                                'is_distraction_app': '$is_distraction_app'
                            }
                        }
                    }
                }
            ]
            
            result = await self.db.app_time_tracking.aggregate(pipeline).to_list(length=1)
            
            if result:
                data = result[0]
                apps = data.get('apps', [])
                
                focus_time = sum(app['total_time_seconds'] for app in apps if app.get('is_focus_app', False))
                distraction_time = sum(app['total_time_seconds'] for app in apps if app.get('is_distraction_app', False))
                
                summary_doc = {
                    'user_id': self.user_id,
                    'date': date_start,
                    'hour': hour,
                    'total_time_seconds': data['total_time_seconds'],
                    'focus_time_seconds': focus_time,
                    'distraction_time_seconds': distraction_time,
                    'app_count': len(apps),
                    'last_updated': datetime.utcnow()
                }
                
                await self.db.hourly_summary.update_one(
                    {
                        'user_id': self.user_id,
                        'date': date_start,
                        'hour': hour
                    },
                    {'$set': summary_doc},
                    upsert=True
                )
                
        except Exception as e:
            logger.error(f"Error storing hourly summary: {e}")
    
    async def get_average_system_metric(self, metric_field, start_time, end_time):
        """Get average system metric for a time period"""
        try:
            pipeline = [
                {
                    '$match': {
                        'user_id': self.user_id,
                        'timestamp': {'$gte': start_time, '$lt': end_time}
                    }
                },
                {
                    '$group': {
                        '_id': None,
                        'average': {'$avg': f'${metric_field}'}
                    }
                }
            ]
            
            result = await self.db.system_metrics.aggregate(pipeline).to_list(length=1)
            return result[0]['average'] if result else 0
            
        except Exception as e:
            logger.error(f"Error calculating average metric: {e}")
            return 0
    
    async def run_data_collection(self):
        """Main data collection loop"""
        logger.info(f"Starting application data collector for user: {self.user_id}")
        logger.info(f"Collection interval: {self.collection_interval} seconds")
        
        while True:
            try:
                await self.collect_and_store_data()
                await asyncio.sleep(self.collection_interval)
            except Exception as e:
                logger.error(f"Error in data collection loop: {e}")
                await asyncio.sleep(self.collection_interval)
    
    async def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("Database connection closed")

async def main():
    collector = ApplicationDataCollector()
    
    try:
        await collector.connect_to_database()
        await collector.run_data_collection()
    except KeyboardInterrupt:
        logger.info("Data collection stopped by user")
    except Exception as e:
        logger.error(f"Data collector error: {e}")
    finally:
        await collector.close()

if __name__ == "__main__":
    asyncio.run(main())