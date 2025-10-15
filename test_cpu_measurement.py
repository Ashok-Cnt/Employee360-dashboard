import psutil
import time

def check_cpu_methods():
    print("Testing CPU measurement methods for VS Code:\n")
    
    # Find VS Code processes
    code_procs = [p for p in psutil.process_iter(['pid', 'name']) 
                  if 'code' in p.info['name'].lower()]
    
    print(f"Found {len(code_procs)} VS Code processes\n")
    
    # Method 1: Single call with interval (blocking)
    print("Method 1: cpu_percent(interval=0.1) - BLOCKING")
    total_cpu_1 = 0
    for p in code_procs:
        try:
            cpu = p.cpu_percent(interval=0.1)
            total_cpu_1 += cpu
            if cpu > 0:
                print(f"  PID {p.pid}: {cpu:.1f}%")
        except:
            pass
    print(f"Total CPU (Method 1): {total_cpu_1:.1f}%\n")
    
    # Method 2: Initialize then read (non-blocking)
    print("Method 2: Initialize + cpu_percent(interval=None) - NON-BLOCKING")
    
    # Initialize all processes
    for p in code_procs:
        try:
            p.cpu_percent(interval=None)
        except:
            pass
    
    # Wait a bit
    time.sleep(0.5)
    
    # Read values
    total_cpu_2 = 0
    for p in code_procs:
        try:
            cpu = p.cpu_percent(interval=None)
            total_cpu_2 += cpu
            if cpu > 0:
                print(f"  PID {p.pid}: {cpu:.1f}%")
        except:
            pass
    print(f"Total CPU (Method 2): {total_cpu_2:.1f}%\n")
    
    # Show Task Manager equivalent
    print("Task Manager view (sum of all processes):")
    print(f"  Total CPU: ~{total_cpu_2:.1f}%")

check_cpu_methods()
