#!/usr/bin/env python3
"""
Test script to compare memory usage calculation with Task Manager
"""
import psutil
import time

def get_memory_comparison():
    """Compare our memory calculation with what Task Manager should show"""
    print("Comparing Memory Usage with Task Manager")
    print("=" * 50)
    
    # Get all processes grouped by name (like our collector does)
    applications = {}
    
    for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'cpu_percent']):
        try:
            info = proc.info
            name = info['name']
            
            # Focus on common applications
            if name.lower() in ['msedge.exe', 'chrome.exe', 'code.exe', 'explorer.exe', 'firefox.exe']:
                if name not in applications:
                    applications[name] = {
                        'processes': [],
                        'total_memory_mb': 0,
                        'total_memory_bytes': 0,
                        'process_count': 0
                    }
                
                # Get memory usage
                if info['memory_info']:
                    memory_bytes = info['memory_info'].rss
                    memory_mb = memory_bytes / (1024 * 1024)
                    
                    applications[name]['processes'].append({
                        'pid': info['pid'],
                        'memory_mb': round(memory_mb, 2),
                        'memory_bytes': memory_bytes
                    })
                    
                    applications[name]['total_memory_mb'] += memory_mb
                    applications[name]['total_memory_bytes'] += memory_bytes
                    applications[name]['process_count'] += 1
                    
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    
    # Display results
    for app_name, data in applications.items():
        if data['process_count'] > 0:
            print(f"\n{app_name}:")
            print(f"  Total Memory: {data['total_memory_mb']:.2f} MB ({data['total_memory_bytes']:,} bytes)")
            print(f"  Process Count: {data['process_count']}")
            
            if data['process_count'] > 1:
                print("  Individual Processes:")
                for proc in data['processes']:
                    print(f"    PID {proc['pid']}: {proc['memory_mb']:.2f} MB")
    
    print("\n" + "=" * 50)
    print("Instructions:")
    print("1. Open Task Manager (Ctrl+Shift+Esc)")
    print("2. Go to 'Details' tab")
    print("3. Right-click column headers and ensure 'Memory (private working set)' is visible")
    print("4. Compare the memory values above with Task Manager")
    print("5. For multi-process apps (like Chrome/Edge), sum all processes with the same name")

if __name__ == "__main__":
    get_memory_comparison()