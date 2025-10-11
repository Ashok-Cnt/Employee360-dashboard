"""
Application Activity Monitor
Tracks active applications every minute and stores in MongoDB
"""
import psutil
import time
import json
from datetime import datetime
from typing import List, Dict, Any
import threading
import schedule
import logging
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ApplicationMonitor:
    """Monitor active applications and store in database"""
    
    def __init__(self):
        self.db_client = None
        self.db = None
        self.collection = None
        self.is_running = False
        self.connect_to_database()
    
    def connect_to_database(self):
        """Connect to MongoDB database"""
        try:
            database_url = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
            database_name = os.getenv("DATABASE_NAME", "employee360")
            
            self.db_client = MongoClient(database_url)
            self.db = self.db_client[database_name]
            self.collection = self.db["application_activity"]
            
            logger.info(f"Connected to MongoDB: {database_name}")
            
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    def get_active_applications(self) -> List[Dict[str, Any]]:
        """Get list of currently running applications"""
        try:
            applications = []
            current_time = datetime.utcnow()
            
            # Get all running processes
            for proc in psutil.process_iter(['pid', 'name', 'exe', 'memory_info', 'cpu_percent', 'create_time']):
                try:
                    process_info = proc.info
                    
                    # Skip system processes and those without executable path
                    if not process_info['exe'] or not process_info['name']:
                        continue
                    
                    # Skip common system processes
                    system_processes = [
                        'System', 'Registry', 'smss.exe', 'csrss.exe', 'wininit.exe',
                        'winlogon.exe', 'services.exe', 'lsass.exe', 'svchost.exe',
                        'dwm.exe', 'explorer.exe', 'conhost.exe', 'RuntimeBroker.exe'
                    ]
                    
                    if process_info['name'] in system_processes:
                        continue
                    
                    # Get memory usage in MB
                    memory_mb = process_info['memory_info'].rss / (1024 * 1024) if process_info['memory_info'] else 0
                    
                    # Calculate running time
                    create_time = datetime.fromtimestamp(process_info['create_time'])
                    running_time = (current_time - create_time).total_seconds()
                    
                    app_data = {
                        'pid': process_info['pid'],
                        'name': process_info['name'],
                        'executable_path': process_info['exe'],
                        'memory_usage_mb': round(memory_mb, 2),
                        'cpu_percent': process_info['cpu_percent'] or 0,
                        'create_time': create_time,
                        'running_time_seconds': round(running_time, 2),
                        'timestamp': current_time,
                        'status': 'active'
                    }
                    
                    applications.append(app_data)
                    
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    # Process might have ended or we don't have permission
                    continue
                except Exception as e:
                    logger.warning(f"Error processing {proc}: {e}")
                    continue
            
            # Sort by memory usage (highest first)
            applications.sort(key=lambda x: x['memory_usage_mb'], reverse=True)
            
            logger.info(f"Found {len(applications)} active applications")
            return applications
            
        except Exception as e:
            logger.error(f"Error getting active applications: {e}")
            return []
    
    def get_focused_window_info(self) -> Dict[str, Any]:
        """Get information about the currently focused window (Windows only)"""
        try:
            import win32gui
            import win32process
            
            # Get the currently focused window
            hwnd = win32gui.GetForegroundWindow()
            if hwnd:
                # Get window title
                window_title = win32gui.GetWindowText(hwnd)
                
                # Get process ID of the window
                _, pid = win32process.GetWindowThreadProcessId(hwnd)
                
                # Get process information
                try:
                    process = psutil.Process(pid)
                    return {
                        'window_title': window_title,
                        'process_name': process.name(),
                        'executable_path': process.exe(),
                        'pid': pid,
                        'is_focused': True,
                        'timestamp': datetime.utcnow()
                    }
                except psutil.NoSuchProcess:
                    return None
            
            return None
            
        except ImportError:
            logger.warning("pywin32 not installed. Cannot track focused window.")
            return None
        except Exception as e:
            logger.error(f"Error getting focused window: {e}")
            return None
    
    def store_application_data(self, applications: List[Dict[str, Any]], focused_window: Dict[str, Any] = None):
        """Store application data in MongoDB"""
        try:
            if not applications:
                return
            
            # Create a snapshot document
            snapshot = {
                'timestamp': datetime.utcnow(),
                'total_applications': len(applications),
                'applications': applications,
                'focused_window': focused_window,
                'system_info': {
                    'cpu_count': psutil.cpu_count(),
                    'memory_total_gb': round(psutil.virtual_memory().total / (1024**3), 2),
                    'memory_used_gb': round(psutil.virtual_memory().used / (1024**3), 2),
                    'memory_percent': psutil.virtual_memory().percent
                }
            }
            
            # Insert into database
            result = self.collection.insert_one(snapshot)
            logger.info(f"Stored application snapshot with ID: {result.inserted_id}")
            
            # Clean up old records (keep only last 24 hours)
            cutoff_time = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            deleted = self.collection.delete_many({'timestamp': {'$lt': cutoff_time}})
            if deleted.deleted_count > 0:
                logger.info(f"Cleaned up {deleted.deleted_count} old records")
            
        except Exception as e:
            logger.error(f"Error storing application data: {e}")
    
    def run_monitoring_cycle(self):
        """Run one cycle of application monitoring"""
        try:
            logger.info("Starting application monitoring cycle...")
            
            # Get active applications
            applications = self.get_active_applications()
            
            # Get focused window (if available)
            focused_window = self.get_focused_window_info()
            
            # Store in database
            self.store_application_data(applications, focused_window)
            
            logger.info("Monitoring cycle completed successfully")
            
        except Exception as e:
            logger.error(f"Error in monitoring cycle: {e}")
    
    def start_monitoring(self):
        """Start the monitoring process"""
        logger.info("Starting Application Monitor...")
        
        # Schedule the monitoring to run every minute
        schedule.every(1).minutes.do(self.run_monitoring_cycle)
        
        # Run initial cycle immediately
        self.run_monitoring_cycle()
        
        self.is_running = True
        
        # Keep running the scheduler
        while self.is_running:
            schedule.run_pending()
            time.sleep(1)
    
    def stop_monitoring(self):
        """Stop the monitoring process"""
        logger.info("Stopping Application Monitor...")
        self.is_running = False
        if self.db_client:
            self.db_client.close()
    
    def get_recent_activity(self, hours: int = 1) -> List[Dict[str, Any]]:
        """Get recent application activity from database"""
        try:
            cutoff_time = datetime.utcnow().replace(
                hour=datetime.utcnow().hour - hours,
                minute=0, second=0, microsecond=0
            )
            
            cursor = self.collection.find(
                {'timestamp': {'$gte': cutoff_time}},
                {'_id': 0}
            ).sort('timestamp', -1)
            
            return list(cursor)
            
        except Exception as e:
            logger.error(f"Error getting recent activity: {e}")
            return []


def main():
    """Main function to run the application monitor"""
    monitor = ApplicationMonitor()
    
    try:
        # Start monitoring in a separate thread
        monitor_thread = threading.Thread(target=monitor.start_monitoring)
        monitor_thread.daemon = True
        monitor_thread.start()
        
        print("Application Monitor is running...")
        print("Press Ctrl+C to stop")
        
        # Keep the main thread alive
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nStopping Application Monitor...")
        monitor.stop_monitoring()
        print("Application Monitor stopped.")


if __name__ == "__main__":
    main()