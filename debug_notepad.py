#!/usr/bin/env python3
"""
Debug Notepad tracking issues
"""
import psutil
import platform
import ctypes
from ctypes import wintypes
import os
import configparser

def has_visible_window(pid):
    """Check if a process has a visible window that would appear in taskbar"""
    try:
        if platform.system() != 'Windows':
            return False
            
        # Windows API constants
        WS_VISIBLE = 0x10000000
        WS_EX_TOOLWINDOW = 0x00000080
        WS_EX_APPWINDOW = 0x00040000
        GWL_EXSTYLE = -20
        GWL_STYLE = -16
        
        # Get user32 DLL
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
                    
                    # Get window title
                    title_length = user32.GetWindowTextLengthW(hwnd)
                    title = ""
                    if title_length > 0:
                        buff = ctypes.create_unicode_buffer(title_length + 1)
                        user32.GetWindowTextW(hwnd, buff, title_length + 1)
                        title = buff.value
                    
                    # Check if it's a regular window (not a tool window)
                    is_tool_window = (ex_style & WS_EX_TOOLWINDOW) != 0
                    is_app_window = (ex_style & WS_EX_APPWINDOW) != 0
                    is_visible = (style & WS_VISIBLE) != 0
                    
                    print(f"    Window HWND {hwnd}: '{title}'")
                    print(f"      Visible: {is_visible}, Tool Window: {is_tool_window}, App Window: {is_app_window}")
                    print(f"      Title Length: {title_length}")
                    
                    # Window should appear in taskbar if:
                    # - It's visible
                    # - It has a title
                    # - It's not a tool window OR it's explicitly an app window
                    if is_visible and title_length > 0 and (not is_tool_window or is_app_window):
                        found_window[0] = True
                        print(f"      -> QUALIFIED for taskbar")
                        return False  # Stop enumeration
                    else:
                        print(f"      -> Not qualified for taskbar")
            
            return True  # Continue enumeration
        
        # Define the callback type
        EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
        
        # Enumerate all windows
        user32.EnumWindows(EnumWindowsProc(enum_windows_proc), 0)
        
        return found_window[0]
        
    except Exception as e:
        print(f"    Error checking windows: {e}")
        return True

def is_user_application(proc, info):
    """Check if process is a user application"""
    try:
        name = info['name'].lower()
        
        # Excluded processes
        excluded_processes = {
            'system', 'registry', 'smss.exe', 'csrss.exe', 'wininit.exe', 
            'winlogon.exe', 'services.exe', 'lsass.exe', 'lsm.exe', 'svchost.exe',
            'dwm.exe', 'explorer.exe', 'audiodg.exe', 'spoolsv.exe', 'taskhost.exe',
            'taskhostw.exe', 'conhost.exe', 'rundll32.exe', 'dllhost.exe',
            'msdtc.exe', 'wuauclt.exe', 'searchindexer.exe', 'wmiprvse.exe'
        }
        
        if name in excluded_processes:
            print(f"    Excluded as system process")
            return False
        
        if not info.get('exe'):
            print(f"    No executable path")
            return False
        
        exe_path = info.get('exe', '').lower()
        
        # Skip Windows system directories
        if any(sys_dir in exe_path for sys_dir in [
            'c:\\windows\\system32\\', 'c:\\windows\\syswow64\\',
            'c:\\windows\\winsxs\\', 'c:\\windows\\servicing\\',
            'c:\\windows\\sysnative\\'
        ]):
            print(f"    In Windows system directory: {exe_path}")
            return False
        
        # Must be in a user application directory or be a user executable
        user_app_dirs = [
            'c:\\program files\\', 'c:\\program files (x86)\\',
            'c:\\users\\', '\\appdata\\local\\programs\\',
            '\\appdata\\roaming\\', '\\desktop\\', '\\downloads\\'
        ]
        
        # For notepad.exe, it's in system32 but should be allowed
        if name == 'notepad.exe':
            print(f"    Special case: Notepad allowed")
            return True
        
        if not any(app_dir in exe_path for app_dir in user_app_dirs):
            print(f"    Not in user app directory: {exe_path}")
            return False
        
        if not name.endswith('.exe'):
            print(f"    Not an executable")
            return False
            
        print(f"    Qualified as user application")
        return True
        
    except Exception as e:
        print(f"    Error checking user application: {e}")
        return False

def should_track_application(process_name, memory_mb=0):
    """Check if application should be tracked based on configuration"""
    try:
        config = configparser.ConfigParser()
        config_path = os.path.join('data-collector', 'config.ini')
        
        if os.path.exists(config_path):
            config.read(config_path)
        
        # Check if tracking is enabled
        if not config.getboolean('tracking_enabled', 'enabled', fallback=True):
            print(f"    Tracking disabled")
            return False
        
        # Check memory threshold
        min_memory = config.getfloat('memory_thresholds', 'minimum_memory_mb', fallback=10)
        if memory_mb < min_memory:
            print(f"    Below memory threshold: {memory_mb:.2f} MB < {min_memory} MB")
            return False
        
        # Remove .exe extension for checking
        clean_name = process_name.lower().replace('.exe', '')
        
        # Check exclusions first
        if config.has_section('exclusions'):
            excluded = config.get('exclusions', 'excluded_processes', fallback='')
            if excluded:
                excluded_list = [item.strip() for item in excluded.split(',')]
                if clean_name in [ex.lower() for ex in excluded_list]:
                    print(f"    In exclusion list")
                    return False
        
        # Check specific applications
        if config.has_section('specific_applications'):
            if config.has_option('specific_applications', clean_name):
                enabled = config.getboolean('specific_applications', clean_name, fallback=True)
                print(f"    Specific config: {enabled}")
                return enabled
        
        # If not specifically configured, allow by default
        print(f"    Default: allowed")
        return True
        
    except Exception as e:
        print(f"    Error checking config: {e}")
        return True

def debug_notepad():
    """Debug why Notepad isn't being tracked"""
    print("DEBUGGING NOTEPAD TRACKING")
    print("=" * 50)
    
    for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'exe']):
        try:
            info = proc.info
            name = info['name'].lower()
            
            if 'notepad' in name:
                print(f"\nFound process: {info['name']} (PID {info['pid']})")
                print(f"  Executable: {info['exe']}")
                
                # Check memory
                try:
                    full_mem_info = proc.memory_full_info()
                    memory_mb = full_mem_info.uss / (1024 * 1024)
                except (psutil.AccessDenied, AttributeError):
                    memory_mb = info['memory_info'].rss / (1024 * 1024) if info['memory_info'] else 0
                
                print(f"  Memory: {memory_mb:.2f} MB")
                
                # Step 1: Check if it's a user application
                print(f"\n  Step 1: User Application Check:")
                is_user_app = is_user_application(proc, info)
                print(f"    Result: {is_user_app}")
                
                if not is_user_app:
                    print("    FAILED: Not recognized as user application")
                    continue
                
                # Step 2: Check configuration
                print(f"\n  Step 2: Configuration Check:")
                should_track = should_track_application(info['name'], memory_mb)
                print(f"    Result: {should_track}")
                
                if not should_track:
                    print("    FAILED: Configuration doesn't allow tracking")
                    continue
                
                # Step 3: Check visible window
                print(f"\n  Step 3: Visible Window Check:")
                has_window = has_visible_window(info['pid'])
                print(f"    Result: {has_window}")
                
                if not has_window:
                    print("    FAILED: No visible window found")
                    continue
                
                print(f"\n  ✅ PASSED ALL CHECKS - Should be tracked!")
                
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

if __name__ == "__main__":
    debug_notepad()