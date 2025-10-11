# Frontend Setup Guide

This directory contains the React frontend application for the Employee360.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000).
The page will reload if you make edits.

### `npm run build`
Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm test`
Launches the test runner in interactive watch mode.

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── Navbar.js      # Top navigation bar
│   └── Sidebar.js     # Side navigation menu
├── pages/             # Main page components
│   ├── Dashboard.js   # Main dashboard overview
│   ├── WorkPatterns.js # Work pattern analysis
│   ├── LearningProgress.js # Learning tracking
│   ├── HealthMetrics.js # Health data visualization
│   └── AIInsights.js  # AI-powered insights
├── store/             # Redux state management
│   ├── store.js       # Store configuration
│   └── slices/        # Redux slices
├── App.js             # Main app component
└── index.js           # Entry point
```

## Key Dependencies

- **React**: UI framework
- **Material-UI**: Component library for design
- **Chart.js**: Data visualization
- **Redux Toolkit**: State management
- **React Router**: Navigation
- **Axios**: HTTP client for API calls

## API Integration

The frontend communicates with the backend API at `http://localhost:8000/api`. 
Key API endpoints:

- `/auth/login` - User authentication
- `/work-patterns/` - Work pattern data
- `/learning/` - Learning progress
- `/health/` - Health metrics
- `/insights/` - AI insights

## Environment Variables

Create a `.env` file in the frontend directory:

```bash
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENV=development
```

## Features

### Dashboard Overview
- Real-time productivity metrics
- Interactive charts and graphs
- Quick action buttons
- Recent activity timeline

### Work Pattern Analysis
- Focus time tracking
- Task switching analysis
- Meeting load visualization
- Productivity trends

### Learning Progress
- Course completion tracking
- Skill growth visualization
- Personalized recommendations
- Learning analytics

### Health Metrics
- Sleep quality analysis
- Activity tracking
- Stress monitoring
- Health-productivity correlations

### AI Insights
- Achievement summaries
- Feedback analysis
- Improvement recommendations
- Productivity predictions

## Customization

### Adding New Charts
1. Install chart library if needed
2. Create chart component in `components/`
3. Import and use in relevant page
4. Connect to Redux store for data

### Styling
The app uses Material-UI theming. Modify `src/index.js` to customize:
- Color palette
- Typography
- Component styles
- Dark/light mode

### Adding New Pages
1. Create page component in `pages/`
2. Add route in `App.js`
3. Add navigation item in `Sidebar.js`
4. Create Redux slice if state management needed

## Performance Optimization

- Lazy loading for route components
- Memoization for expensive computations
- Virtual scrolling for large data sets
- Image optimization and compression

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy `build` folder to your web server or hosting service

### Popular Hosting Options
- Netlify (automatic deploys from Git)
- Vercel (optimized for React)
- AWS S3 + CloudFront
- GitHub Pages

## Troubleshooting

### Common Issues

**Port 3000 already in use**
```bash
npx kill-port 3000
npm start
```

**Module not found errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

**API connection issues**
- Check backend is running on port 8000
- Verify CORS settings in backend
- Check network/firewall settings

## Development Tips

1. Use React Developer Tools browser extension
2. Enable Redux DevTools for state debugging
3. Use ESLint and Prettier for code quality
4. Write unit tests for components
5. Use React.memo() for performance optimization

## Contributing

1. Follow React best practices
2. Use TypeScript for better type safety
3. Write meaningful commit messages
4. Add tests for new features
5. Update documentation for changes