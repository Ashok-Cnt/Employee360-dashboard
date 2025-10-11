// Sample data for testing the Employee360 dashboard
// Run this after initializing the database

use employee360;

// Insert sample user
const sampleUserId = ObjectId();
db.users.insertOne({
  _id: sampleUserId,
  email: "demo@example.com",
  username: "demo_user",
  full_name: "Demo User",
  hashed_password: "$2b$12$dummy.hash.for.demo.purposes.only",
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
});

// Sample work sessions data
const workSessions = [
  {
    user_id: sampleUserId,
    start_time: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    end_time: new Date(Date.now() - 6 * 60 * 60 * 1000),   // 6 hours ago
    duration_minutes: 120,
    task_type: "deep_work",
    application_name: "Visual Studio Code",
    website_url: null,
    productivity_score: 0.9,
    created_at: new Date()
  },
  {
    user_id: sampleUserId,
    start_time: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    end_time: new Date(Date.now() - 4 * 60 * 60 * 1000),   // 4 hours ago
    duration_minutes: 60,
    task_type: "meeting",
    application_name: "Microsoft Teams",
    website_url: "https://teams.microsoft.com",
    productivity_score: 0.7,
    created_at: new Date()
  },
  {
    user_id: sampleUserId,
    start_time: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    end_time: new Date(Date.now() - 2 * 60 * 60 * 1000),   // 2 hours ago
    duration_minutes: 60,
    task_type: "learning",
    application_name: "Web Browser",
    website_url: "https://coursera.org",
    productivity_score: 0.85,
    created_at: new Date()
  }
];

db.work_sessions.insertMany(workSessions);

// Sample meetings data
const meetings = [
  {
    user_id: sampleUserId,
    title: "Sprint Planning",
    start_time: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    end_time: new Date(Date.now() - 23 * 60 * 60 * 1000),
    duration_minutes: 60,
    attendees_count: 6,
    meeting_type: "planning",
    productivity_rating: 4,
    created_at: new Date()
  },
  {
    user_id: sampleUserId,
    title: "Daily Standup",
    start_time: new Date(Date.now() - 8 * 60 * 60 * 1000),
    end_time: new Date(Date.now() - 7.75 * 60 * 60 * 1000),
    duration_minutes: 15,
    attendees_count: 8,
    meeting_type: "standup",
    productivity_rating: 3,
    created_at: new Date()
  }
];

db.meetings.insertMany(meetings);

// Sample completed courses
const courses = [
  {
    user_id: sampleUserId,
    course_title: "Advanced React Patterns",
    provider: "Frontend Masters",
    completion_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    duration_hours: 8,
    skill_tags: ["React", "JavaScript", "Frontend"],
    certificate_url: "https://example.com/certificate/123",
    rating: 5,
    created_at: new Date()
  },
  {
    user_id: sampleUserId,
    course_title: "Python for Data Science",
    provider: "Coursera",
    completion_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    duration_hours: 12,
    skill_tags: ["Python", "Data Science", "Machine Learning"],
    certificate_url: "https://example.com/certificate/456",
    rating: 4,
    created_at: new Date()
  }
];

db.completed_courses.insertMany(courses);

// Sample health data - sleep
const sleepData = [];
for (let i = 0; i < 7; i++) {
  sleepData.push({
    user_id: sampleUserId,
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    bedtime: new Date(Date.now() - i * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000),
    wake_time: new Date(Date.now() - i * 24 * 60 * 60 * 1000 + 31 * 60 * 60 * 1000),
    duration_hours: 7.5 + (Math.random() - 0.5),
    quality_score: 7 + Math.random() * 2,
    deep_sleep_minutes: 90 + Math.random() * 30,
    sleep_efficiency: 0.85 + Math.random() * 0.1,
    created_at: new Date()
  });
}

db.health_sleep.insertMany(sleepData);

// Sample health data - activity
const activityData = [];
for (let i = 0; i < 7; i++) {
  activityData.push({
    user_id: sampleUserId,
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    steps: 8000 + Math.floor(Math.random() * 4000),
    distance_km: 5 + Math.random() * 3,
    active_minutes: 30 + Math.floor(Math.random() * 60),
    workout_count: Math.floor(Math.random() * 2),
    workout_duration_minutes: Math.floor(Math.random() * 60),
    calories_burned: 2000 + Math.floor(Math.random() * 500),
    created_at: new Date()
  });
}

db.health_activity.insertMany(activityData);

// Sample stress data
const stressData = [];
for (let i = 0; i < 20; i++) {
  stressData.push({
    user_id: sampleUserId,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    stress_level: 3 + Math.random() * 4,
    heart_rate: 65 + Math.floor(Math.random() * 30),
    source: ["manual", "wearable", "app"][Math.floor(Math.random() * 3)],
    notes: ["Work deadline", "Meeting prep", "Exercise recovery", "Normal day"][Math.floor(Math.random() * 4)],
    created_at: new Date()
  });
}

db.health_stress.insertMany(stressData);

// Sample feedback data
const feedbackData = [
  {
    user_id: sampleUserId,
    feedback_text: "Great work on the new feature implementation. Code quality is excellent and the solution is very efficient.",
    source: "Code Review",
    sentiment_score: 0.8,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    tags: ["code_quality", "efficiency", "positive"],
    feedback_type: "peer_feedback",
    created_at: new Date()
  },
  {
    user_id: sampleUserId,
    feedback_text: "Shows strong problem-solving skills and attention to detail. Could improve on presentation skills during team meetings.",
    source: "Performance Review",
    sentiment_score: 0.6,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    tags: ["problem_solving", "presentation", "improvement_area"],
    feedback_type: "performance_review",
    created_at: new Date()
  }
];

db.user_feedback.insertMany(feedbackData);

print("✅ Sample data inserted successfully!");
print("Sample user ID: " + sampleUserId);
print("Login credentials: demo@example.com / demo123");
print("Ready for testing!");