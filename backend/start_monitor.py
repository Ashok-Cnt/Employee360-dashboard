"""
Startup script for the Application Monitor
Run this to start monitoring applications in the background
"""
import subprocess
import sys
import os
import time
import signal
from pathlib import Path

def install_dependencies():
    """Install required dependencies"""
    print("Installing dependencies...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", 
            "psutil", "schedule", "pywin32", "pymongo", "python-dotenv"
        ])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def start_monitor():
    """Start the application monitor"""
    script_path = Path(__file__).parent / "app_monitor.py"
    
    if not script_path.exists():
        print(f"❌ Monitor script not found: {script_path}")
        return None
    
    print("🚀 Starting Application Monitor...")
    print("Press Ctrl+C to stop monitoring")
    
    try:
        # Start the monitor process
        process = subprocess.Popen([
            sys.executable, str(script_path)
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        print(f"✅ Application Monitor started (PID: {process.pid})")
        print("Monitoring applications every minute...")
        print("Check 'app_monitor.log' for detailed logs")
        
        return process
        
    except Exception as e:
        print(f"❌ Failed to start monitor: {e}")
        return None

def main():
    """Main function"""
    print("🔧 Employee360 Application Monitor Setup")
    print("=" * 50)
    
    # Check if dependencies are installed
    try:
        import psutil
        import schedule
        print("✅ Dependencies already installed")
    except ImportError:
        if not install_dependencies():
            return
    
    # Start the monitor
    process = start_monitor()
    if not process:
        return
    
    try:
        # Keep the script running and monitor the subprocess
        while True:
            time.sleep(5)
            
            # Check if process is still running
            if process.poll() is not None:
                print("⚠️  Monitor process stopped unexpectedly")
                stdout, stderr = process.communicate()
                if stdout:
                    print("STDOUT:", stdout)
                if stderr:
                    print("STDERR:", stderr)
                break
                
    except KeyboardInterrupt:
        print("\n🛑 Stopping Application Monitor...")
        process.terminate()
        try:
            process.wait(timeout=5)
            print("✅ Monitor stopped successfully")
        except subprocess.TimeoutExpired:
            print("⚠️  Force killing monitor process...")
            process.kill()
            print("✅ Monitor force stopped")

if __name__ == "__main__":
    main()