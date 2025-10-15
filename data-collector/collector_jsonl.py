import asyncio
import logging
import os
import psutil
import time
import json
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
import platform
import ctypes
from ctypes import wintypes
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
    'Productive': [
        'Visual Studio Code', 'Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint',
        'JetBrains Rider', 'IntelliJ IDEA', 'PyCharm', 'WebStorm', 'Adobe Photoshop',
        'Adobe Illustrator', 'MongoDB Compass', 'Postman', 'Sublime Text', 'Notepad++',
        'Visual Studio', 'Eclipse', 'NetBeans', 'Android Studio'
    ],
    'Communication': [
        'Microsoft Teams', 'Slack', 'Discord', 'Zoom', 'Skype', 'WhatsApp',
        'Telegram', 'Microsoft Outlook', 'Gmail', 'Thunderbird', 'Google Meet'
    ],
    'Browsers': [
        'Google Chrome', 'Mozilla Firefox', 'Microsoft Edge', 'Opera Browser',
        'Brave Browser', 'Safari', 'Vivaldi'
    ],
    'Media': [
        'Spotify', 'VLC Media Player', 'Netflix', 'YouTube', 'iTunes',
        'Windows Media Player', 'Photos'
    ],
    'Non-Productive': [
        'Steam', 'EA Origin', 'Epic Games Launcher', 'Battle.net', 'Xbox',
        'Facebook', 'Instagram', 'Twitter', 'Reddit', 'TikTok'
    ]
}

class ActivityTracker:
    """Tracks application activity and system metrics"""
    
    def __init__(self):
        self.collection_interval = int(os.getenv('COLLECTION_INTERVAL_SECONDS', 60))
        self.user_id = os.getenv('USER_ID', getpass.getuser())
        self.data_dir = Path(os.getenv('DATA_DIR', './activity_data'))
        self.data_dir.mkdir(exist_ok=True)
        
        # Session tracking
        self.session_start = datetime.now()
        self.current_date = datetime.now().date()
        self.current_jsonl_file = None
        
        # In-memory tracking for aggregation
        self.app_tracking = defaultdict(lambda: {
            'name': '',
            'title': '',
            'category': 'Uncategorized',
            'total_run_seconds': 0,
            'total_focus_seconds': 0,
            'hourly_stats': defaultdict(lambda: {'focus_seconds': 0, 'run_seconds': 0}),
            'last_seen': None,
            'is_focused': False
        })
        
        self.hourly_summary = defaultdict(lambda: {
            'productive_focus_sec': 0,
            'communication_focus_sec': 0,
            'browsers_focus_sec': 0,
            'media_focus_sec': 0,
            'non_productive_focus_sec': 0,
            'idle_sec': 0,
            'total_cpu': [],
            'total_memory': []
        })
        
        # System metrics tracking
        self.system_metrics = {
            'total_cpu': [],
            'total_memory': [],
            'uptime_start': psutil.boot_time(),
            'session_start': time.time()
        }
        
        # Idle detection
        self.last_activity_time = time.time()
        self.idle_threshold = 300  # 5 minutes
        
        # Load configuration
        self.config = configparser.ConfigParser()
        config_path = Path(__file__).parent / 'config.ini'
        if config_path.exists():
            self.config.read(config_path)
            logger.info(f"Loaded configuration from {config_path}")
        
        # Windows API for getting foreground window
        if platform.system() == 'Windows':
            self.user32 = ctypes.windll.user32
            self.kernel32 = ctypes.windll.kernel32
    
    def is_window_visible(self, hwnd):
        """Check if a window is visible and has taskbar presence"""
        if not hwnd:
            return False
        
        # Check if window is visible
        if not self.user32.IsWindowVisible(hwnd):
            return False
        
        # Get window title first - if no title, likely not a real app window
        length = self.user32.GetWindowTextLengthW(hwnd)
        if length == 0:
            return False
        
        buff = ctypes.create_unicode_buffer(length + 1)
        self.user32.GetWindowTextW(hwnd, buff, length + 1)
        window_title = buff.value
        
        # Skip windows with no meaningful title
        if not window_title or len(window_title.strip()) == 0:
            return False
        
        # Check window styles
        GWL_EXSTYLE = -20
        GWL_STYLE = -16
        WS_EX_APPWINDOW = 0x00040000
        WS_EX_TOOLWINDOW = 0x00000080
        WS_VISIBLE = 0x10000000
        WS_OVERLAPPEDWINDOW = 0x00CF0000
        
        ex_style = self.user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
        style = self.user32.GetWindowLongW(hwnd, GWL_STYLE)
        
        # Window is a tool window - skip it
        has_tool_window = (ex_style & WS_EX_TOOLWINDOW) != 0
        if has_tool_window:
            return False
        
        # Window explicitly marked as app window - definitely show it
        has_app_window = (ex_style & WS_EX_APPWINDOW) != 0
        if has_app_window:
            return True
        
        # Check if it's a normal overlapped window (most app windows are)
        is_overlapped = (style & WS_OVERLAPPEDWINDOW) == WS_OVERLAPPEDWINDOW
        is_visible_style = (style & WS_VISIBLE) != 0
        
        # If it's a visible overlapped window with a title, it's likely a taskbar app
        if is_overlapped and is_visible_style and window_title:
            return True
        
        # Check if window has an owner - owned windows are usually dialogs
        owner = self.user32.GetWindow(hwnd, 4)  # GW_OWNER = 4
        if owner == 0:  # No owner means it's a top-level window
            return True
        
        return False
    
    def get_visible_windows(self):
        """Get all visible windows that appear in taskbar"""
        visible_windows = {}
        
        def enum_windows_callback(hwnd, lParam):
            if self.is_window_visible(hwnd):
                try:
                    # Get process ID
                    pid = wintypes.DWORD()
                    self.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                    
                    # Get process
                    try:
                        process = psutil.Process(pid.value)
                        process_name = process.name()
                        
                        # Get window title
                        length = self.user32.GetWindowTextLengthW(hwnd)
                        if length > 0:
                            buff = ctypes.create_unicode_buffer(length + 1)
                            self.user32.GetWindowTextW(hwnd, buff, length + 1)
                            window_title = buff.value
                            
                            if window_title and process_name:
                                visible_windows[process_name] = {
                                    'name': process_name,
                                    'title': window_title,
                                    'hwnd': hwnd
                                }
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
                except Exception:
                    pass
            return True
        
        # Enumerate all top-level windows
        EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.POINTER(ctypes.c_int), ctypes.POINTER(ctypes.c_int))
        callback = EnumWindowsProc(enum_windows_callback)
        self.user32.EnumWindows(callback, 0)
        
        return visible_windows
    
    def get_jsonl_filename(self, date=None):
        """Get JSONL filename for a specific date"""
        if date is None:
            date = datetime.now().date()
        filename = f"activity_{date.isoformat()}_{self.user_id}.jsonl"
        return self.data_dir / filename
    
    def get_app_category(self, app_name):
        """Determine the category of an application"""
        for category, apps in APP_CATEGORIES.items():
            if any(known_app.lower() in app_name.lower() for known_app in apps):
                return category
        return 'Uncategorized'
    
    def get_foreground_window_info(self):
        """Get information about the currently focused window (Windows only)"""
        if platform.system() != 'Windows':
            return None, None
        
        try:
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
    
    def get_friendly_app_name(self, process_name):
        """Convert process name to user-friendly application name"""
        app_name_map = {
            'code.exe': 'Visual Studio Code',
            'chrome.exe': 'Google Chrome',
            'msedge.exe': 'Microsoft Edge',
            'firefox.exe': 'Mozilla Firefox',
            'teams.exe': 'Microsoft Teams',
            'ms-teams.exe': 'Microsoft Teams',
            'outlook.exe': 'Microsoft Outlook',
            'slack.exe': 'Slack',
            'discord.exe': 'Discord',
            'spotify.exe': 'Spotify',
            'winword.exe': 'Microsoft Word',
            'excel.exe': 'Microsoft Excel',
            'powerpnt.exe': 'Microsoft PowerPoint',
            'notepad++.exe': 'Notepad++',
            'sublime_text.exe': 'Sublime Text',
            'mongodbcompass.exe': 'MongoDB Compass',
            'mongod.exe': 'MongoDB Server',
        }
        
        process_lower = process_name.lower()
        if process_lower in app_name_map:
            return app_name_map[process_lower]
        
        # Remove .exe and capitalize
        if process_lower.endswith('.exe'):
            clean_name = process_name[:-4]
        else:
            clean_name = process_name
        
        return ' '.join(word.capitalize() for word in clean_name.replace('_', ' ').replace('-', ' ').split())
    
    def get_running_applications(self):
        """Get list of running applications"""
        applications = {}
        
        # First pass: get initial CPU readings (non-blocking)
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                proc.cpu_percent(interval=None)  # Initialize CPU measurement
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
        
        # Small delay to allow CPU measurement
        import time
        time.sleep(0.1)
        
        # Second pass: collect data with accurate CPU readings
        for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'cpu_percent']):
            try:
                info = proc.info
                name = info['name']
                
                if self.is_user_application(proc, info):
                    if name not in applications:
                        applications[name] = {
                            'name': name,
                            'memory_mb': 0,
                            'cpu_percent': 0,
                            'process_count': 0
                        }
                    
                    memory_mb = info['memory_info'].rss / (1024 * 1024) if info['memory_info'] else 0
                    # Get current CPU percent (should now have valid measurement)
                    try:
                        cpu_percent = proc.cpu_percent(interval=None) or 0
                    except:
                        cpu_percent = 0
                    
                    applications[name]['memory_mb'] += memory_mb
                    applications[name]['cpu_percent'] += cpu_percent
                    applications[name]['process_count'] += 1
                    
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
        
        return list(applications.values())
    
    def is_user_application(self, proc, info):
        """Determine if a process is a user application"""
        try:
            name = info['name'].lower()
            
            # Exclude obvious system processes
            excluded_processes = {
                'system', 'registry', 'smss.exe', 'csrss.exe', 'wininit.exe',
                'services.exe', 'lsass.exe', 'svchost.exe', 'dwm.exe',
                'taskmgr.exe', 'conhost.exe', 'rundll32.exe', 'wudfhost.exe',
                'spoolsv.exe', 'lsaiso.exe', 'fontdrvhost.exe', 'dllhost.exe',
                'runtimebroker.exe', 'sihost.exe', 'ctfmon.exe', 'taskhostw.exe',
                'searchindexer.exe', 'searchprotocolhost.exe', 'winlogon.exe'
            }
            
            if name in excluded_processes:
                return False
            
            # Try to get exe path, but don't fail if unavailable
            try:
                exe_path = proc.exe().lower() if hasattr(proc, 'exe') else ''
            except (psutil.AccessDenied, psutil.NoSuchProcess):
                # If we can't get the path but it's not in excluded list, include it
                # This catches cases where we have permission issues
                return True
            
            # Exclude Windows system directories
            if exe_path and any(sys_dir in exe_path for sys_dir in [
                'c:\\windows\\system32\\', 
                'c:\\windows\\syswow64\\',
                'c:\\windows\\systemapps\\'
            ]):
                return False
            
            # Include everything else (programs in Program Files, user directories, etc.)
            return True
            
        except Exception as e:
            logger.debug(f"Error checking if user application: {e}")
            return False
    
    def get_idle_time(self):
        """Get system idle time in seconds (Windows)"""
        if platform.system() != 'Windows':
            return 0
        
        try:
            class LASTINPUTINFO(ctypes.Structure):
                _fields_ = [
                    ('cbSize', ctypes.c_uint),
                    ('dwTime', ctypes.c_uint),
                ]
            
            lastInputInfo = LASTINPUTINFO()
            lastInputInfo.cbSize = ctypes.sizeof(lastInputInfo)
            
            if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lastInputInfo)):
                millis = ctypes.windll.kernel32.GetTickCount() - lastInputInfo.dwTime
                return millis / 1000.0
            else:
                return 0
        except Exception as e:
            logger.warning(f"Error getting idle time: {e}")
            return 0
    
    def get_battery_info(self):
        """Get battery information"""
        try:
            battery = psutil.sensors_battery()
            if battery:
                return {
                    'percent': battery.percent,
                    'is_charging': battery.power_plugged
                }
        except Exception as e:
            logger.warning(f"Error getting battery info: {e}")
        
        return {'percent': None, 'is_charging': None}
    
    def collect_snapshot(self):
        """Collect current activity snapshot with full details matching the required JSON structure"""
        current_time = datetime.now()
        current_hour = current_time.strftime("%H:00")
        
        # Get foreground window
        foreground_process, window_title = self.get_foreground_window_info()
        
        # Get visible windows (taskbar apps)
        visible_windows = self.get_visible_windows()
        
        # Get running applications
        running_apps = self.get_running_applications()
        
        # System metrics
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        memory_usage_mb = memory.used / (1024 * 1024)
        
        # Idle detection
        idle_time_sec = self.get_idle_time()
        is_idle = idle_time_sec > self.idle_threshold
        
        # Track idle time if system has been idle for at least the collection interval
        # This ensures we capture short idle periods (like when screen is locked)
        if idle_time_sec >= self.collection_interval:
            idle_time_to_add = min(idle_time_sec, self.collection_interval)
        else:
            idle_time_to_add = 0
        
        # Battery info
        battery_info = self.get_battery_info()
        
        # System uptime
        uptime_sec = time.time() - self.system_metrics['uptime_start']
        
        # Track metrics for aggregation
        self.system_metrics['total_cpu'].append(cpu_usage)
        self.system_metrics['total_memory'].append(memory_usage_mb)
        
        # Separate visible/taskbar apps from background apps
        taskbar_apps = []
        background_apps = []
        
        # Aggregate tracking for background apps
        background_total_run_seconds = 0
        background_total_focus_seconds = 0
        background_hourly_stats = defaultdict(lambda: {'focus_seconds': 0, 'run_seconds': 0})
        
        focused_app_name = None
        
        # Create a lookup dictionary for app resources
        app_resources = {app['name']: app for app in running_apps}
        
        for app in running_apps:
            process_name = app['name']
            friendly_name = self.get_friendly_app_name(process_name)
            category = self.get_app_category(friendly_name)
            
            is_focused = (foreground_process and app['name'] == foreground_process)
            is_visible = process_name in visible_windows
            
            app_key = process_name
            
            # Initialize or update app tracking
            if app_key not in self.app_tracking or self.app_tracking[app_key]['name'] == '':
                self.app_tracking[app_key]['name'] = process_name
                self.app_tracking[app_key]['title'] = friendly_name
                self.app_tracking[app_key]['category'] = category
            
            self.app_tracking[app_key]['is_focused'] = is_focused
            self.app_tracking[app_key]['last_seen'] = current_time
            
            # Add running time
            self.app_tracking[app_key]['total_run_seconds'] += self.collection_interval
            self.app_tracking[app_key]['hourly_stats'][current_hour]['run_seconds'] += self.collection_interval
            
            # Add focus time if focused
            if is_focused:
                focused_app_name = process_name
                self.app_tracking[app_key]['total_focus_seconds'] += self.collection_interval
                self.app_tracking[app_key]['hourly_stats'][current_hour]['focus_seconds'] += self.collection_interval
                
                # Update hourly summary by category
                if category == 'Productive':
                    self.hourly_summary[current_hour]['productive_focus_sec'] += self.collection_interval
                elif category == 'Communication':
                    self.hourly_summary[current_hour]['communication_focus_sec'] += self.collection_interval
                elif category == 'Browsers':
                    self.hourly_summary[current_hour]['browsers_focus_sec'] += self.collection_interval
                elif category == 'Media':
                    self.hourly_summary[current_hour]['media_focus_sec'] += self.collection_interval
                elif category == 'Non-Productive':
                    self.hourly_summary[current_hour]['non_productive_focus_sec'] += self.collection_interval
            
            # Build hourly stats for this app
            hourly_stats = [
                {
                    'hour': hour,
                    'focusSeconds': stats['focus_seconds'],
                    'runSeconds': stats['run_seconds']
                }
                for hour, stats in sorted(self.app_tracking[app_key]['hourly_stats'].items())
            ]
            
            # Get current resource usage for this app
            app_info = app_resources.get(process_name, {})
            current_memory_mb = app_info.get('memory_mb', 0)
            current_cpu_percent = app_info.get('cpu_percent', 0)
            
            app_data = {
                'name': process_name,
                'title': friendly_name,
                'category': category,
                'isFocused': is_focused,
                'runningTimeSec': self.app_tracking[app_key]['total_run_seconds'],
                'focusDurationSec': self.app_tracking[app_key]['total_focus_seconds'],
                'cpuUsage': round(current_cpu_percent, 1),
                'memoryUsageMB': round(current_memory_mb, 1),
                'aggregates': {
                    'totalRunHours': round(self.app_tracking[app_key]['total_run_seconds'] / 3600, 2),
                    'totalFocusHours': round(self.app_tracking[app_key]['total_focus_seconds'] / 3600, 2)
                },
                'hourlyStats': hourly_stats
            }
            
            # Categorize as taskbar or background
            # Uncategorized apps are always treated as background
            if category == 'Uncategorized':
                background_apps.append(app_data)
            elif is_visible or is_focused:
                # Visible in taskbar or currently focused
                taskbar_apps.append(app_data)
            else:
                # Background app - aggregate it
                background_apps.append(app_data)
                background_total_run_seconds += self.app_tracking[app_key]['total_run_seconds']
                background_total_focus_seconds += self.app_tracking[app_key]['total_focus_seconds']
                
                # Aggregate hourly stats
                for hour, stats in self.app_tracking[app_key]['hourly_stats'].items():
                    background_hourly_stats[hour]['run_seconds'] += stats['run_seconds']
                    background_hourly_stats[hour]['focus_seconds'] += stats['focus_seconds']
        
        # Calculate aggregated CPU and memory for background apps
        background_total_cpu = sum(app.get('cpuUsage', 0) for app in background_apps)
        background_total_memory = sum(app.get('memoryUsageMB', 0) for app in background_apps)
        
        # Create aggregated background apps entry
        if background_apps:
            background_hourly_list = [
                {
                    'hour': hour,
                    'focusSeconds': stats['focus_seconds'],
                    'runSeconds': stats['run_seconds']
                }
                for hour, stats in sorted(background_hourly_stats.items())
            ]
            
            aggregated_background = {
                'name': 'background_apps',
                'title': f'Other Background Apps ({len(background_apps)} apps)',
                'category': 'Background',
                'isFocused': False,
                'runningTimeSec': background_total_run_seconds,
                'focusDurationSec': background_total_focus_seconds,
                'cpuUsage': round(background_total_cpu, 1),
                'memoryUsageMB': round(background_total_memory, 1),
                'aggregates': {
                    'totalRunHours': round(background_total_run_seconds / 3600, 2),
                    'totalFocusHours': round(background_total_focus_seconds / 3600, 2)
                },
                'hourlyStats': background_hourly_list
            }
            
            # Add aggregated background apps to the list
            apps_snapshot = taskbar_apps + [aggregated_background]
        else:
            apps_snapshot = taskbar_apps
        
        # Track idle time (add idle seconds accumulated in this interval)
        if idle_time_to_add > 0:
            self.hourly_summary[current_hour]['idle_sec'] += idle_time_to_add
        
        # Track CPU and memory by hour
        self.hourly_summary[current_hour]['total_cpu'].append(cpu_usage)
        self.hourly_summary[current_hour]['total_memory'].append(memory_usage_mb)
        
        # Calculate monitoring hours
        monitoring_seconds = (current_time - self.session_start).total_seconds()
        monitoring_hours = monitoring_seconds / 3600
        
        # Calculate category totals
        productive_seconds = sum(
            app['total_focus_seconds'] 
            for app in self.app_tracking.values() 
            if app['category'] == 'Productive'
        )
        communication_seconds = sum(
            app['total_focus_seconds'] 
            for app in self.app_tracking.values() 
            if app['category'] == 'Communication'
        )
        
        total_idle_seconds = sum(hour['idle_sec'] for hour in self.hourly_summary.values())
        
        # System aggregates
        avg_cpu = sum(self.system_metrics['total_cpu']) / len(self.system_metrics['total_cpu']) if self.system_metrics['total_cpu'] else 0
        
        # Build hourly summary
        hourly_summary_data = []
        for hour, data in sorted(self.hourly_summary.items()):
            hourly_summary_data.append({
                'hour': hour,
                'productiveFocusSec': data['productive_focus_sec'],
                'communicationFocusSec': data['communication_focus_sec'],
                'idleSec': data['idle_sec']
            })
        
        # Create complete snapshot record matching the required structure
        snapshot = {
            'timestamp': current_time.isoformat() + 'Z',
            'system': {
                'cpuUsage': round(cpu_usage, 1),
                'memoryUsageMB': round(memory_usage_mb, 0),
                'batteryPercent': battery_info['percent'],
                'isCharging': battery_info['is_charging'],
                'uptimeSec': round(uptime_sec, 0),
                'idleTimeSec': round(idle_time_sec, 0),
                'isIdle': is_idle,
                'aggregates': {
                    'overallMonitoringHours': round(monitoring_hours, 2),
                    'productiveHours': round(productive_seconds / 3600, 2),
                    'communicationHours': round(communication_seconds / 3600, 2),
                    'idleHours': round(total_idle_seconds / 3600, 2),
                    'avgCPU': round(avg_cpu, 1)
                }
            },
            'apps': apps_snapshot,
            'hourlySummary': hourly_summary_data
        }
        
        return snapshot
    
    def append_to_jsonl(self, data):
        """Append data to JSONL file"""
        jsonl_file = self.get_jsonl_filename()
        
        try:
            with open(jsonl_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(data) + '\n')
            logger.info(f"Appended snapshot to {jsonl_file}")
        except Exception as e:
            logger.error(f"Error writing to JSONL: {e}")
    
    def generate_aggregated_report(self):
        """Generate aggregated daily report"""
        current_time = datetime.now()
        
        # Calculate overall monitoring time
        monitoring_seconds = (current_time - self.session_start).total_seconds()
        monitoring_hours = monitoring_seconds / 3600
        
        # Calculate category totals
        productive_seconds = sum(
            app['total_focus_seconds'] 
            for app in self.app_tracking.values() 
            if app['category'] == 'Productive'
        )
        communication_seconds = sum(
            app['total_focus_seconds'] 
            for app in self.app_tracking.values() 
            if app['category'] == 'Communication'
        )
        
        total_idle_seconds = sum(hour['idle_sec'] for hour in self.hourly_summary.values())
        
        # System aggregates
        avg_cpu = sum(self.system_metrics['total_cpu']) / len(self.system_metrics['total_cpu']) if self.system_metrics['total_cpu'] else 0
        avg_memory = sum(self.system_metrics['total_memory']) / len(self.system_metrics['total_memory']) if self.system_metrics['total_memory'] else 0
        
        # Build apps array
        apps_data = []
        for app_key, app_data in self.app_tracking.items():
            if app_data['total_run_seconds'] > 0:
                hourly_stats = [
                    {
                        'hour': hour,
                        'focusSeconds': stats['focus_seconds'],
                        'runSeconds': stats['run_seconds']
                    }
                    for hour, stats in sorted(app_data['hourly_stats'].items())
                ]
                
                apps_data.append({
                    'name': app_data['name'],
                    'title': app_data['title'],
                    'category': app_data['category'],
                    'isFocused': app_data['is_focused'],
                    'runningTimeSec': app_data['total_run_seconds'],
                    'focusDurationSec': app_data['total_focus_seconds'],
                    'aggregates': {
                        'totalRunHours': round(app_data['total_run_seconds'] / 3600, 2),
                        'totalFocusHours': round(app_data['total_focus_seconds'] / 3600, 2)
                    },
                    'hourlyStats': hourly_stats
                })
        
        # Build hourly summary
        hourly_summary_data = []
        for hour, data in sorted(self.hourly_summary.items()):
            hourly_summary_data.append({
                'hour': hour,
                'productiveFocusSec': data['productive_focus_sec'],
                'communicationFocusSec': data['communication_focus_sec'],
                'idleSec': data['idle_sec']
            })
        
        # Battery info
        battery_info = self.get_battery_info()
        
        # System uptime
        uptime_sec = time.time() - self.system_metrics['uptime_start']
        
        # Build final report matching the required structure exactly
        report = {
            'timestamp': current_time.isoformat() + 'Z',
            'system': {
                'cpuUsage': round(avg_cpu, 1),
                'memoryUsageMB': round(avg_memory, 0),
                'batteryPercent': battery_info['percent'],
                'isCharging': battery_info['is_charging'],
                'uptimeSec': round(uptime_sec, 0),
                'idleTimeSec': round(total_idle_seconds, 0),
                'isIdle': self.get_idle_time() > self.idle_threshold,
                'aggregates': {
                    'overallMonitoringHours': round(monitoring_hours, 2),
                    'productiveHours': round(productive_seconds / 3600, 2),
                    'communicationHours': round(communication_seconds / 3600, 2),
                    'idleHours': round(total_idle_seconds / 3600, 2),
                    'avgCPU': round(avg_cpu, 1)
                }
            },
            'apps': apps_data,
            'hourlySummary': hourly_summary_data
        }
        
        return report
    
    def save_daily_report(self):
        """Save the aggregated daily report"""
        report = self.generate_aggregated_report()
        
        # Save to summary file
        date_str = datetime.now().date().isoformat()
        summary_file = self.data_dir / f"summary_{date_str}_{self.user_id}.json"
        
        try:
            with open(summary_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2)
            logger.info(f"Saved daily summary to {summary_file}")
        except Exception as e:
            logger.error(f"Error saving daily summary: {e}")
    
    def check_date_rollover(self):
        """Check if day has changed and save daily report"""
        current_date = datetime.now().date()
        if current_date != self.current_date:
            logger.info(f"Date rollover detected: {self.current_date} -> {current_date}")
            
            # Save yesterday's report
            self.save_daily_report()
            
            # Reset tracking for new day
            self.current_date = current_date
            self.session_start = datetime.now()
            self.app_tracking.clear()
            self.hourly_summary.clear()
            self.system_metrics['total_cpu'].clear()
            self.system_metrics['total_memory'].clear()
            self.system_metrics['session_start'] = time.time()
    
    async def run(self):
        """Main collection loop"""
        logger.info(f"Starting activity tracker for user: {self.user_id}")
        logger.info(f"Data directory: {self.data_dir.absolute()}")
        logger.info(f"Collection interval: {self.collection_interval} seconds")
        
        while True:
            try:
                # Check for date rollover
                self.check_date_rollover()
                
                # Collect snapshot
                snapshot = self.collect_snapshot()
                
                # Append to JSONL file
                self.append_to_jsonl(snapshot)
                
                # Log status
                focused_app = next((app['name'] for app in snapshot['apps'] if app['isFocused']), 'None')
                logger.info(f"Tracked: {focused_app} | Apps: {len(snapshot['apps'])} | CPU: {snapshot['system']['cpuUsage']:.1f}% | Idle: {snapshot['system']['isIdle']}")
                
                # Wait for next interval
                await asyncio.sleep(self.collection_interval)
                
            except KeyboardInterrupt:
                logger.info("Stopping tracker...")
                break
            except Exception as e:
                logger.error(f"Error in collection loop: {e}", exc_info=True)
                await asyncio.sleep(self.collection_interval)
        
        # Save final report on exit
        logger.info("Saving final daily report...")
        self.save_daily_report()

async def main():
    tracker = ActivityTracker()
    await tracker.run()

if __name__ == "__main__":
    asyncio.run(main())
