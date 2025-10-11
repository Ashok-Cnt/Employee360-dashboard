# MongoDB Database Schema and Setup

This directory contains the MongoDB database schemas, indexes, and initial setup scripts for the Employee360.

## Collections

### Users
- **Purpose**: Store user account information
- **Fields**: email, username, full_name, hashed_password, is_active, created_at, updated_at

### Work Sessions (work_sessions)
- **Purpose**: Track individual work/browsing sessions
- **Fields**: user_id, start_time, end_time, duration_minutes, task_type, application_name, website_url, productivity_score

### Task Switches (task_switches)
- **Purpose**: Record context switching between tasks
- **Fields**: user_id, from_task, to_task, switch_time, context_switch_cost

### Meetings
- **Purpose**: Store meeting information and productivity ratings
- **Fields**: user_id, title, start_time, end_time, duration_minutes, attendees_count, meeting_type, productivity_rating

### Completed Courses (completed_courses)
- **Purpose**: Track learning progress and course completions
- **Fields**: user_id, course_title, provider, completion_date, duration_hours, skill_tags, certificate_url

### Health Sleep (health_sleep)
- **Purpose**: Store sleep tracking data
- **Fields**: user_id, date, bedtime, wake_time, duration_hours, quality_score, deep_sleep_minutes

### Health Activity (health_activity)
- **Purpose**: Track physical activity and exercise
- **Fields**: user_id, date, steps, distance_km, active_minutes, workout_count, workout_duration_minutes, calories_burned

### Health Stress (health_stress)
- **Purpose**: Monitor stress levels and patterns
- **Fields**: user_id, timestamp, stress_level, heart_rate, source, notes

### User Feedback (user_feedback)
- **Purpose**: Store feedback and performance reviews
- **Fields**: user_id, feedback_text, source, sentiment_score, timestamp, tags

## Indexes

Key indexes are created for:
- User lookups (email, username)
- Time-based queries (dates, timestamps)
- User-specific data filtering (user_id)

## Setup

1. Install MongoDB (local or MongoDB Atlas)
2. Run the initialization scripts
3. Configure environment variables
4. Import sample data (optional)