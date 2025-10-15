#!/usr/bin/env python3
"""
Compare all memory types for Notepad++
"""
import psutil

def check_all_memory_types():
    """Check all available memory types for Notepad++"""
    print("All Memory Types for Notepad++")
    print("=" * 50)
    
    for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'memory_full_info']):
        try:
            info = proc.info
            name = info['name'].lower()
            
            if 'notepad++' in name or name == 'notepad++.exe':
                print(f"\nPID {info['pid']} ({info['name']}):")
                
                # Basic memory info
                if info['memory_info']:
                    mem = info['memory_info']
                    print(f"  RSS (Resident Set Size): {mem.rss / (1024*1024):.2f} MB")
                    print(f"  VMS (Virtual Memory Size): {mem.vms / (1024*1024):.2f} MB")
                    
                    # Windows-specific memory info
                    if hasattr(mem, 'wset'):
                        print(f"  Working Set: {mem.wset / (1024*1024):.2f} MB")
                    if hasattr(mem, 'private'):
                        print(f"  Private Bytes: {mem.private / (1024*1024):.2f} MB")
                    if hasattr(mem, 'shared'):
                        print(f"  Shared Bytes: {mem.shared / (1024*1024):.2f} MB")
                
                # Extended memory info  
                try:
                    full_mem = proc.memory_full_info()
                    print(f"  USS (Unique Set Size): {full_mem.uss / (1024*1024):.2f} MB")
                    print(f"  PSS (Proportional Set Size): {full_mem.pss / (1024*1024):.2f} MB")
                    if hasattr(full_mem, 'private'):
                        print(f"  Private (from full_info): {full_mem.private / (1024*1024):.2f} MB")
                except (psutil.AccessDenied, AttributeError):
                    print("  Extended memory info not available")
                
                break
                    
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    
    print(f"\n" + "=" * 50)
    print("Task Manager Memory Column Meanings:")
    print("- Memory: Private Working Set (default)")
    print("- Private Bytes: USS (Unique Set Size)")
    print("- Working Set: Total working set (shared + private)")
    print("- Commit Size: Virtual memory committed")

if __name__ == "__main__":
    check_all_memory_types()