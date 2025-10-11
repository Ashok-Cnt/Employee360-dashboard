# Backend API Documentation

This directory contains the FastAPI backend for the Employee360.

## Prerequisites

- Python 3.8 or higher
- pip package manager
- MongoDB (local installation or MongoDB Atlas)

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=employee360

# API Settings
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=True

# Security
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# External APIs
OPENAI_API_KEY=your-openai-api-key

# CORS
ALLOWED_ORIGINS=["http://localhost:3000"]
```

## Running the Application

### Development Mode
```bash
python main.py
```

### Production Mode
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Using Docker
```bash
docker build -t productivity-backend .
docker run -p 8000:8000 productivity-backend
```

## API Documentation

Once running, visit:
- Interactive API docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## Project Structure

```
app/
├── models/            # Pydantic models for data validation
│   ├── user.py       # User models
│   └── work_pattern.py # Work pattern models
├── routers/          # API route handlers
│   ├── users.py      # User authentication and management
│   ├── work_patterns.py # Work pattern tracking
│   ├── learning.py   # Learning progress APIs
│   ├── health.py     # Health metrics APIs
│   └── insights.py   # AI insights APIs
├── auth.py           # Authentication utilities
├── database.py       # Database connection and utilities
└── __init__.py
main.py               # Application entry point
requirements.txt      # Python dependencies
```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/me` - Get current user info
- `PUT /api/users/me` - Update user profile

### Work Patterns
- `POST /api/work-patterns/sessions` - Create work session
- `GET /api/work-patterns/sessions` - Get work sessions
- `GET /api/work-patterns/focus-hours` - Get focus time analysis
- `GET /api/work-patterns/task-switching` - Get task switching data
- `GET /api/work-patterns/meetings` - Get meeting analysis

### Learning Progress
- `GET /api/learning/courses` - Get completed courses
- `GET /api/learning/skills` - Get skill growth data
- `GET /api/learning/recommendations` - Get learning recommendations

### Health Metrics
- `GET /api/health/sleep` - Get sleep data analysis
- `GET /api/health/activity` - Get activity data
- `GET /api/health/stress` - Get stress level data
- `GET /api/health/correlations` - Get health-productivity correlations

### AI Insights
- `GET /api/insights/achievements` - Get achievement summary
- `GET /api/insights/feedback-analysis` - Get feedback analysis
- `GET /api/insights/recommendations` - Get AI recommendations
- `GET /api/insights/predictions` - Get productivity predictions

## Database Models

### User Model
```python
{
  "email": "string",
  "username": "string", 
  "full_name": "string",
  "hashed_password": "string",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Work Session Model
```python
{
  "user_id": "ObjectId",
  "start_time": "datetime",
  "end_time": "datetime", 
  "duration_minutes": "integer",
  "task_type": "string", # deep_work, meeting, email, etc.
  "application_name": "string",
  "website_url": "string",
  "productivity_score": "float"
}
```

## Security

### Authentication
- JWT (JSON Web Tokens) for user authentication
- Password hashing using bcrypt
- Token expiration and refresh

### Authorization
- Protected routes require valid JWT token
- User-specific data access controls
- Rate limiting on API endpoints

### Data Protection
- Input validation using Pydantic models
- SQL injection prevention
- CORS configuration for browser security

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

### Error Response Format
```json
{
  "detail": "Error message",
  "error_code": "SPECIFIC_ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Performance Optimization

### Database
- Proper indexing on frequently queried fields
- Connection pooling
- Query optimization
- Aggregation pipelines for analytics

### API
- Async/await for non-blocking operations
- Response caching for expensive operations
- Pagination for large data sets
- Background tasks for heavy processing

## Testing

### Running Tests
```bash
pytest tests/
```

### Test Coverage
```bash
pytest --cov=app tests/
```

### Test Structure
```
tests/
├── test_auth.py
├── test_work_patterns.py
├── test_learning.py
├── test_health.py
└── test_insights.py
```

## AI Integration

### OpenAI Integration
The backend integrates with OpenAI for:
- Achievement summarization
- Feedback sentiment analysis
- Productivity recommendations
- Trend analysis

### Configuration
```python
import openai
openai.api_key = os.getenv("OPENAI_API_KEY")
```

## Monitoring and Logging

### Logging
- Structured logging with Python logging module
- Different log levels (DEBUG, INFO, WARNING, ERROR)
- Log rotation and retention policies

### Health Checks
- `GET /health` - Basic health check
- Database connectivity check
- External service availability

### Metrics
- Request/response times
- Error rates
- Database query performance
- User activity metrics

## Deployment

### Docker Deployment
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Cloud Deployment Options
- **AWS**: ECS, Lambda, or EC2
- **Google Cloud**: Cloud Run or App Engine
- **Azure**: Container Instances or App Service
- **Heroku**: Direct deployment with Procfile

### Environment Setup
- Production database (MongoDB Atlas)
- Environment-specific configurations
- SSL/TLS certificates
- Load balancing and scaling

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check MongoDB is running
- Verify connection string
- Check network connectivity

**Import Errors**
```bash
pip install -r requirements.txt
python -m pip install --upgrade pip
```

**Port Already in Use**
```bash
lsof -ti:8000 | xargs kill -9
```

**CORS Issues**
- Check ALLOWED_ORIGINS in .env
- Verify frontend URL is included

## Contributing

1. Follow PEP 8 Python style guide
2. Add type hints to all functions
3. Write comprehensive tests
4. Update API documentation
5. Use meaningful commit messages

## Development Workflow

1. Create feature branch
2. Implement changes with tests
3. Run test suite
4. Update documentation
5. Create pull request
6. Code review and merge