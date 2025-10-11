// MongoDB initialization script
// Run this script to set up the database with proper indexes and collections

use employee360;

// Create collections with validation schemas
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "username", "hashed_password"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
          description: "must be a valid email"
        },
        username: {
          bsonType: "string",
          minLength: 3,
          maxLength: 50,
          description: "must be a string between 3-50 characters"
        },
        full_name: {
          bsonType: "string",
          description: "optional full name"
        },
        hashed_password: {
          bsonType: "string",
          description: "must be a hashed password string"
        },
        is_active: {
          bsonType: "bool",
          description: "user account status"
        },
        created_at: {
          bsonType: "date",
          description: "account creation timestamp"
        },
        updated_at: {
          bsonType: "date",
          description: "last update timestamp"
        }
      }
    }
  }
});

db.createCollection("work_sessions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "start_time", "task_type"],
      properties: {
        user_id: {
          bsonType: "objectId",
          description: "reference to user"
        },
        start_time: {
          bsonType: "date",
          description: "session start time"
        },
        end_time: {
          bsonType: "date",
          description: "session end time"
        },
        duration_minutes: {
          bsonType: "number",
          minimum: 0,
          description: "session duration in minutes"
        },
        task_type: {
          bsonType: "string",
          enum: ["deep_work", "meeting", "email", "planning", "learning", "break", "other"],
          description: "type of work activity"
        },
        application_name: {
          bsonType: "string",
          description: "application or website name"
        },
        website_url: {
          bsonType: "string",
          description: "full URL if web-based activity"
        },
        productivity_score: {
          bsonType: "number",
          minimum: 0,
          maximum: 1,
          description: "productivity score between 0 and 1"
        }
      }
    }
  }
});

db.createCollection("task_switches", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "from_task", "to_task", "switch_time"],
      properties: {
        user_id: {
          bsonType: "objectId",
          description: "reference to user"
        },
        from_task: {
          bsonType: "string",
          description: "previous task/application"
        },
        to_task: {
          bsonType: "string",
          description: "new task/application"
        },
        switch_time: {
          bsonType: "date",
          description: "when the switch occurred"
        },
        context_switch_cost: {
          bsonType: "number",
          minimum: 0,
          maximum: 1,
          description: "estimated productivity loss from switch"
        }
      }
    }
  }
});

db.createCollection("meetings", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "title", "start_time", "end_time"],
      properties: {
        user_id: {
          bsonType: "objectId",
          description: "reference to user"
        },
        title: {
          bsonType: "string",
          description: "meeting title"
        },
        start_time: {
          bsonType: "date",
          description: "meeting start time"
        },
        end_time: {
          bsonType: "date",
          description: "meeting end time"
        },
        duration_minutes: {
          bsonType: "number",
          minimum: 0,
          description: "meeting duration"
        },
        attendees_count: {
          bsonType: "number",
          minimum: 1,
          description: "number of attendees"
        },
        meeting_type: {
          bsonType: "string",
          enum: ["standup", "planning", "review", "one_on_one", "presentation", "workshop", "other"],
          description: "type of meeting"
        },
        productivity_rating: {
          bsonType: "number",
          minimum: 1,
          maximum: 5,
          description: "user rating of meeting productivity"
        }
      }
    }
  }
});

db.createCollection("completed_courses", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "course_title", "completion_date"],
      properties: {
        user_id: {
          bsonType: "objectId",
          description: "reference to user"
        },
        course_title: {
          bsonType: "string",
          description: "name of the completed course"
        },
        provider: {
          bsonType: "string",
          description: "course provider (Coursera, Udemy, etc.)"
        },
        completion_date: {
          bsonType: "date",
          description: "when the course was completed"
        },
        duration_hours: {
          bsonType: "number",
          minimum: 0,
          description: "total course duration"
        },
        skill_tags: {
          bsonType: "array",
          items: {
            bsonType: "string"
          },
          description: "skills learned in the course"
        },
        certificate_url: {
          bsonType: "string",
          description: "URL to certificate if available"
        },
        rating: {
          bsonType: "number",
          minimum: 1,
          maximum: 5,
          description: "user rating of the course"
        }
      }
    }
  }
});

db.createCollection("health_sleep", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "date"],
      properties: {
        user_id: {
          bsonType: "objectId",
          description: "reference to user"
        },
        date: {
          bsonType: "date",
          description: "sleep date"
        },
        bedtime: {
          bsonType: "date",
          description: "when user went to bed"
        },
        wake_time: {
          bsonType: "date",
          description: "when user woke up"
        },
        duration_hours: {
          bsonType: "number",
          minimum: 0,
          maximum: 24,
          description: "total sleep duration"
        },
        quality_score: {
          bsonType: "number",
          minimum: 0,
          maximum: 10,
          description: "sleep quality rating"
        },
        deep_sleep_minutes: {
          bsonType: "number",
          minimum: 0,
          description: "minutes of deep sleep"
        },
        sleep_efficiency: {
          bsonType: "number",
          minimum: 0,
          maximum: 1,
          description: "percentage of time in bed actually sleeping"
        }
      }
    }
  }
});

db.createCollection("health_activity", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "date"],
      properties: {
        user_id: {
          bsonType: "objectId",
          description: "reference to user"
        },
        date: {
          bsonType: "date",
          description: "activity date"
        },
        steps: {
          bsonType: "number",
          minimum: 0,
          description: "daily step count"
        },
        distance_km: {
          bsonType: "number",
          minimum: 0,
          description: "distance traveled in kilometers"
        },
        active_minutes: {
          bsonType: "number",
          minimum: 0,
          description: "minutes of active movement"
        },
        workout_count: {
          bsonType: "number",
          minimum: 0,
          description: "number of workouts"
        },
        workout_duration_minutes: {
          bsonType: "number",
          minimum: 0,
          description: "total workout time"
        },
        calories_burned: {
          bsonType: "number",
          minimum: 0,
          description: "estimated calories burned"
        }
      }
    }
  }
});

db.createCollection("health_stress", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "timestamp", "stress_level"],
      properties: {
        user_id: {
          bsonType: "objectId",
          description: "reference to user"
        },
        timestamp: {
          bsonType: "date",
          description: "when stress was measured"
        },
        stress_level: {
          bsonType: "number",
          minimum: 0,
          maximum: 10,
          description: "stress level from 0-10"
        },
        heart_rate: {
          bsonType: "number",
          minimum: 30,
          maximum: 220,
          description: "heart rate if available"
        },
        source: {
          bsonType: "string",
          enum: ["manual", "wearable", "app"],
          description: "how stress was measured"
        },
        notes: {
          bsonType: "string",
          description: "optional notes about stress factors"
        }
      }
    }
  }
});

db.createCollection("user_feedback", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "feedback_text", "timestamp"],
      properties: {
        user_id: {
          bsonType: "objectId",
          description: "reference to user"
        },
        feedback_text: {
          bsonType: "string",
          description: "the feedback content"
        },
        source: {
          bsonType: "string",
          description: "where the feedback came from"
        },
        sentiment_score: {
          bsonType: "number",
          minimum: -1,
          maximum: 1,
          description: "AI-analyzed sentiment score"
        },
        timestamp: {
          bsonType: "date",
          description: "when feedback was received"
        },
        tags: {
          bsonType: "array",
          items: {
            bsonType: "string"
          },
          description: "categorization tags"
        },
        feedback_type: {
          bsonType: "string",
          enum: ["performance_review", "peer_feedback", "customer_feedback", "self_reflection"],
          description: "type of feedback"
        }
      }
    }
  }
});

print("✅ Collections created successfully!");

// Create indexes for better query performance
print("Creating indexes...");

// Users indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "is_active": 1 });

// Work sessions indexes
db.work_sessions.createIndex({ "user_id": 1, "start_time": -1 });
db.work_sessions.createIndex({ "user_id": 1, "task_type": 1 });
db.work_sessions.createIndex({ "start_time": 1 });

// Task switches indexes
db.task_switches.createIndex({ "user_id": 1, "switch_time": -1 });

// Meetings indexes
db.meetings.createIndex({ "user_id": 1, "start_time": -1 });
db.meetings.createIndex({ "user_id": 1, "meeting_type": 1 });

// Completed courses indexes
db.completed_courses.createIndex({ "user_id": 1, "completion_date": -1 });
db.completed_courses.createIndex({ "skill_tags": 1 });

// Health data indexes
db.health_sleep.createIndex({ "user_id": 1, "date": -1 });
db.health_activity.createIndex({ "user_id": 1, "date": -1 });
db.health_stress.createIndex({ "user_id": 1, "timestamp": -1 });

// Feedback indexes
db.user_feedback.createIndex({ "user_id": 1, "timestamp": -1 });
db.user_feedback.createIndex({ "sentiment_score": 1 });

print("✅ Indexes created successfully!");

// Create compound indexes for common queries
db.work_sessions.createIndex({ "user_id": 1, "start_time": -1, "task_type": 1 });
db.health_sleep.createIndex({ "user_id": 1, "date": -1, "quality_score": -1 });

print("✅ Database initialization completed!");
print("Database: employee360");
print("Collections: " + db.getCollectionNames().length);
print("Ready for application use!");