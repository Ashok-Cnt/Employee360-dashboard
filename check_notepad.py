#!/usr/bin/env python3
"""
Check for Notepad processes
"""
import psutil

def check_notepad():
    """Check for all Notepad-related processes"""
    print("Checking for Notepad processes...")
    print("=" * 50)
    
    found_processes = []
    
    for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'exe']):
        try:
            info = proc.info
            name = info['name'].lower()
            
            # Look for notepad-related processes
            if 'notepad' in name:
                memory_mb = 0
                if info['memory_info']:
                    try:
                        full_mem_info = proc.memory_full_info()
                        memory_mb = full_mem_info.uss / (1024 * 1024)
                    except (psutil.AccessDenied, AttributeError):
                        memory_mb = info['memory_info'].rss / (1024 * 1024)
                
                found_processes.append({
                    'pid': info['pid'],
                    'name': info['name'],
                    'memory_mb': round(memory_mb, 2),
                    'exe': info['exe'] or 'N/A'
                })
                    
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    
    if found_processes:
        print(f"Found {len(found_processes)} Notepad process(es):")
        for proc in found_processes:
            print(f"\nPID {proc['pid']}: {proc['name']}")
            print(f"  Memory: {proc['memory_mb']} MB")
            print(f"  Executable: {proc['exe']}")
    else:
        print("No Notepad processes found.")
        print("Please open Notepad and run this script again.")

if __name__ == "__main__":
    check_notepad()