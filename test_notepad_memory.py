#!/usr/bin/env python3
"""
Specific test for Notepad++ memory usage
"""
import psutil

def check_notepad_memory():
    """Check Notepad++ memory usage specifically"""
    print("Checking Notepad++ Memory Usage")
    print("=" * 40)
    
    notepad_processes = []
    
    for proc in psutil.process_iter(['pid', 'name', 'memory_info']):
        try:
            info = proc.info
            name = info['name'].lower()
            
            if 'notepad++' in name or name == 'notepad++.exe':
                if info['memory_info']:
                    memory_bytes = info['memory_info'].rss
                    memory_mb = memory_bytes / (1024 * 1024)
                    
                    # Also get working set (which is what Task Manager shows by default)
                    memory_working_set = info['memory_info'].wset / (1024 * 1024)
                    
                    notepad_processes.append({
                        'pid': info['pid'],
                        'name': info['name'],
                        'rss_mb': round(memory_mb, 2),
                        'working_set_mb': round(memory_working_set, 2),
                        'rss_bytes': memory_bytes,
                        'working_set_bytes': info['memory_info'].wset
                    })
                    
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    
    if notepad_processes:
        print(f"Found {len(notepad_processes)} Notepad++ process(es):")
        
        total_rss = 0
        total_working_set = 0
        
        for proc in notepad_processes:
            print(f"\nPID {proc['pid']} ({proc['name']}):")
            print(f"  RSS (Resident Set Size): {proc['rss_mb']} MB")
            print(f"  Working Set: {proc['working_set_mb']} MB")
            print(f"  RSS Bytes: {proc['rss_bytes']:,}")
            print(f"  Working Set Bytes: {proc['working_set_bytes']:,}")
            
            total_rss += proc['rss_mb']
            total_working_set += proc['working_set_mb']
        
        print(f"\nTOTAL:")
        print(f"  RSS: {total_rss:.2f} MB")
        print(f"  Working Set: {total_working_set:.2f} MB")
        
        print(f"\nOur app is using RSS: {total_rss:.2f} MB")
        print(f"Task Manager shows Working Set: {total_working_set:.2f} MB")
        print(f"\nNote: Task Manager 'Memory' column shows Working Set by default,")
        print(f"but we're using RSS which can be different.")
    else:
        print("No Notepad++ processes found.")
        print("Please open Notepad++ and run this script again.")

if __name__ == "__main__":
    check_notepad_memory()