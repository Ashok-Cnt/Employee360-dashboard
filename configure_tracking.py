#!/usr/bin/env python3
"""
Employee360 Application Tracking Configuration Manager

This script allows users to easily configure which applications to track.
"""
import configparser
import os

def load_config():
    """Load the current configuration"""
    config = configparser.ConfigParser()
    config_path = os.path.join(os.path.dirname(__file__), 'data-collector', 'config.ini')
    
    if os.path.exists(config_path):
        config.read(config_path)
        return config, config_path
    else:
        print(f"Configuration file not found at {config_path}")
        return None, config_path

def save_config(config, config_path):
    """Save the configuration"""
    with open(config_path, 'w') as configfile:
        config.write(configfile)
    print(f"Configuration saved to {config_path}")

def show_current_config():
    """Display current configuration"""
    config, _ = load_config()
    if not config:
        return
    
    print("\n" + "="*60)
    print("CURRENT APPLICATION TRACKING CONFIGURATION")
    print("="*60)
    
    # Show general settings
    if config.has_section('tracking_enabled'):
        enabled = config.getboolean('tracking_enabled', 'enabled', fallback=True)
        max_apps = config.get('tracking_enabled', 'max_applications', fallback='50')
        print(f"\nGeneral Settings:")
        print(f"  Tracking Enabled: {enabled}")
        print(f"  Max Applications: {max_apps}")
    
    # Show memory settings
    if config.has_section('memory_thresholds'):
        min_mem = config.get('memory_thresholds', 'minimum_memory_mb', fallback='10')
        high_mem = config.get('memory_thresholds', 'high_memory_threshold_mb', fallback='1000')
        print(f"\nMemory Thresholds:")
        print(f"  Minimum Memory: {min_mem} MB")
        print(f"  High Memory Alert: {high_mem} MB")
    
    # Show specific applications
    if config.has_section('specific_applications'):
        print(f"\nSpecific Applications:")
        apps = config.items('specific_applications')
        enabled_apps = [app for app, enabled in apps if enabled.lower() == 'true']
        disabled_apps = [app for app, enabled in apps if enabled.lower() == 'false']
        
        print(f"  Enabled ({len(enabled_apps)}): {', '.join(enabled_apps[:10])}{'...' if len(enabled_apps) > 10 else ''}")
        print(f"  Disabled ({len(disabled_apps)}): {', '.join(disabled_apps[:10])}{'...' if len(disabled_apps) > 10 else ''}")
    
    # Show exclusions
    if config.has_section('exclusions'):
        excluded = config.get('exclusions', 'excluded_processes', fallback='')
        if excluded:
            excluded_list = [item.strip() for item in excluded.split(',')]
            print(f"\nAlways Excluded: {', '.join(excluded_list)}")

def toggle_application(app_name, enable=True):
    """Enable or disable tracking for a specific application"""
    config, config_path = load_config()
    if not config:
        return
    
    if not config.has_section('specific_applications'):
        config.add_section('specific_applications')
    
    config.set('specific_applications', app_name.lower(), str(enable).lower())
    save_config(config, config_path)
    
    status = "enabled" if enable else "disabled"
    print(f"Application '{app_name}' {status} for tracking.")

def set_memory_threshold(min_memory_mb):
    """Set minimum memory threshold"""
    config, config_path = load_config()
    if not config:
        return
    
    if not config.has_section('memory_thresholds'):
        config.add_section('memory_thresholds')
    
    config.set('memory_thresholds', 'minimum_memory_mb', str(min_memory_mb))
    save_config(config, config_path)
    
    print(f"Minimum memory threshold set to {min_memory_mb} MB")

def interactive_menu():
    """Interactive configuration menu"""
    while True:
        print("\n" + "="*50)
        print("EMPLOYEE360 APPLICATION TRACKING CONFIG")
        print("="*50)
        print("1. Show current configuration")
        print("2. Enable application tracking")
        print("3. Disable application tracking")
        print("4. Set memory threshold")
        print("5. Enable all common applications")
        print("6. Disable all applications")
        print("7. Exit")
        
        choice = input("\nSelect an option (1-7): ").strip()
        
        if choice == '1':
            show_current_config()
        
        elif choice == '2':
            app_name = input("Enter application name (e.g., 'chrome', 'notepad++', 'calc'): ").strip()
            if app_name:
                toggle_application(app_name, True)
        
        elif choice == '3':
            app_name = input("Enter application name to disable: ").strip()
            if app_name:
                toggle_application(app_name, False)
        
        elif choice == '4':
            try:
                threshold = float(input("Enter minimum memory threshold (MB): ").strip())
                set_memory_threshold(threshold)
            except ValueError:
                print("Invalid number. Please enter a valid memory threshold.")
        
        elif choice == '5':
            # Enable common applications
            common_apps = ['chrome', 'firefox', 'msedge', 'code', 'notepad++', 'teams', 'slack', 'zoom', 'spotify', 'vlc']
            config, config_path = load_config()
            if config:
                if not config.has_section('specific_applications'):
                    config.add_section('specific_applications')
                
                for app in common_apps:
                    config.set('specific_applications', app, 'true')
                
                save_config(config, config_path)
                print(f"Enabled tracking for {len(common_apps)} common applications")
        
        elif choice == '6':
            confirm = input("Are you sure you want to disable ALL applications? (yes/no): ").strip().lower()
            if confirm == 'yes':
                config, config_path = load_config()
                if config and config.has_section('specific_applications'):
                    for app, _ in config.items('specific_applications'):
                        config.set('specific_applications', app, 'false')
                    save_config(config, config_path)
                    print("Disabled tracking for all applications")
        
        elif choice == '7':
            print("Goodbye!")
            break
        
        else:
            print("Invalid choice. Please select 1-7.")

if __name__ == "__main__":
    interactive_menu()