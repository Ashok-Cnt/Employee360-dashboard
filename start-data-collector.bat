@echo off
echo Starting Employee360 Data Collector...
echo Note: Will automatically use current logged-in user for tracking
cd /d "C:\Users\Gbs05262\HackathonWorkSpace\Employee360-dashboard\data-collector"
python collector_Jsonl.py
pause