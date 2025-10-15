import psutil

def check_app_memory(app_name):
    procs = [p for p in psutil.process_iter(['pid', 'name', 'memory_info', 'cpu_percent']) 
             if app_name.lower() in p.info['name'].lower()]
    
    print(f"\n{app_name} Analysis:")
    print(f"Number of processes: {len(procs)}")
    
    if not procs:
        print("No processes found")
        return
    
    total_memory = 0
    total_cpu = 0
    
    for p in procs:
        if p.info['memory_info']:
            mem_mb = p.info['memory_info'].rss / (1024 * 1024)
            cpu = p.info['cpu_percent'] or 0
            total_memory += mem_mb
            total_cpu += cpu
            print(f"  PID {p.pid}: Memory={mem_mb:.1f} MB, CPU={cpu:.1f}%")
    
    print(f"Total: Memory={total_memory:.1f} MB, CPU={total_cpu:.1f}%")
    
    # Check with Working Set (what Task Manager shows)
    total_wss = sum(p.info['memory_info'].wset / (1024*1024) for p in procs if hasattr(p.info['memory_info'], 'wset'))
    if total_wss > 0:
        print(f"Working Set (Task Manager view): {total_wss:.1f} MB")

# Check multiple apps
check_app_memory("notepad++")
check_app_memory("chrome")
check_app_memory("msedge")
check_app_memory("code")
