/**
 * Google Fit API Integration Service
 * Handles OAuth authentication and data fetching
 * 
 * Setup required:
 * 1. Create project in Google Cloud Console
 * 2. Enable Fitness API
 * 3. Create OAuth 2.0 credentials
 * 4. Add to .env: REACT_APP_GOOGLE_FIT_CLIENT_ID
 */

const GOOGLE_FIT_CONFIG = {
  CLIENT_ID: process.env.REACT_APP_GOOGLE_FIT_CLIENT_ID || '',
  API_KEY: process.env.REACT_APP_GOOGLE_FIT_API_KEY || '',
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest'],
  SCOPES: [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'https://www.googleapis.com/auth/fitness.location.read'
  ].join(' ')
};

class GoogleFitService {
  constructor() {
    this.isAuthenticated = false;
    this.accessToken = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Google API client
   */
  async initialize() {
    try {
      return await new Promise((resolve, reject) => {
        // Check if gapi is loaded
        if (!window.gapi) {
          reject(new Error('Google API script not loaded'));
          return;
        }

        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              apiKey: GOOGLE_FIT_CONFIG.API_KEY,
              clientId: GOOGLE_FIT_CONFIG.CLIENT_ID,
              discoveryDocs: GOOGLE_FIT_CONFIG.DISCOVERY_DOCS,
              scope: GOOGLE_FIT_CONFIG.SCOPES
            });

            // Check if already signed in
            const authInstance = window.gapi.auth2.getAuthInstance();
            this.isAuthenticated = authInstance.isSignedIn.get();
            this.isInitialized = true;

            if (this.isAuthenticated) {
              this.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
            }

            console.log('✅ Google Fit API initialized');
            resolve({ 
              success: true, 
              isAuthenticated: this.isAuthenticated 
            });
          } catch (error) {
            console.error('❌ Error initializing Google Fit API:', error);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('❌ Google Fit initialization error:', error);
      throw error;
    }
  }

  /**
   * Sign in to Google
   */
  async signIn() {
    try {
      if (!this.isInitialized) {
        throw new Error('Google Fit API not initialized. Call initialize() first.');
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signIn();

      this.isAuthenticated = true;
      this.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;

      console.log('✅ Signed in to Google Fit');
      return { success: true };
    } catch (error) {
      console.error('❌ Error signing in to Google Fit:', error);
      return { success: false, error: error.message || 'Failed to sign in' };
    }
  }

  /**
   * Sign out from Google
   */
  async signOut() {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();

      this.isAuthenticated = false;
      this.accessToken = null;

      console.log('✅ Signed out from Google Fit');
      return { success: true };
    } catch (error) {
      console.error('❌ Error signing out:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch activity data (steps, calories, distance)
   */
  async fetchActivityData(startDate, endDate) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated. Please sign in first.');
      }

      const startTimeMillis = new Date(startDate).getTime();
      const endTimeMillis = new Date(endDate).getTime();

      console.log(`📊 Fetching activity data from ${startDate} to ${endDate}`);

      const response = await window.gapi.client.fitness.users.dataset.aggregate({
        userId: 'me',
        resource: {
          aggregateBy: [
            { dataTypeName: 'com.google.step_count.delta' },
            { dataTypeName: 'com.google.calories.expended' },
            { dataTypeName: 'com.google.distance.delta' },
            { dataTypeName: 'com.google.active_minutes' }
          ],
          bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
          startTimeMillis,
          endTimeMillis
        }
      });

      const activityData = this.processActivityData(response.result.bucket);
      console.log(`✅ Fetched ${activityData.length} days of activity data`);
      
      return { success: true, data: activityData };
    } catch (error) {
      console.error('❌ Error fetching activity data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch heart rate data
   */
  async fetchHeartRateData(startDate, endDate) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated. Please sign in first.');
      }

      const startTimeMillis = new Date(startDate).getTime();
      const endTimeMillis = new Date(endDate).getTime();

      console.log(`❤️  Fetching heart rate data from ${startDate} to ${endDate}`);

      const response = await window.gapi.client.fitness.users.dataset.aggregate({
        userId: 'me',
        resource: {
          aggregateBy: [
            { dataTypeName: 'com.google.heart_rate.bpm' }
          ],
          bucketByTime: { durationMillis: 3600000 }, // 1 hour buckets
          startTimeMillis,
          endTimeMillis
        }
      });

      const heartRateData = this.processHeartRateData(response.result.bucket);
      console.log(`✅ Fetched ${heartRateData.length} heart rate data points`);
      
      return { success: true, data: heartRateData };
    } catch (error) {
      console.error('❌ Error fetching heart rate data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch sleep data
   */
  async fetchSleepData(startDate, endDate) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated. Please sign in first.');
      }

      const startTimeMillis = new Date(startDate).getTime();
      const endTimeMillis = new Date(endDate).getTime();

      console.log(`😴 Fetching sleep data from ${startDate} to ${endDate}`);

      const response = await window.gapi.client.fitness.users.sessions.list({
        userId: 'me',
        startTime: new Date(startTimeMillis).toISOString(),
        endTime: new Date(endTimeMillis).toISOString(),
        activityType: 72 // Sleep session type
      });

      const sleepData = this.processSleepData(response.result.session || []);
      console.log(`✅ Fetched ${sleepData.length} sleep sessions`);
      
      return { success: true, data: sleepData };
    } catch (error) {
      console.error('❌ Error fetching sleep data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process activity data buckets into simplified format
   */
  processActivityData(buckets) {
    return buckets.map(bucket => {
      const date = new Date(parseInt(bucket.startTimeMillis));
      let steps = 0;
      let calories = 0;
      let distance = 0;
      let activeMinutes = 0;

      bucket.dataset.forEach(dataset => {
        dataset.point.forEach(point => {
          const dataType = point.dataTypeName;
          
          if (dataType === 'com.google.step_count.delta') {
            steps += point.value[0].intVal || 0;
          } else if (dataType === 'com.google.calories.expended') {
            calories += point.value[0].fpVal || 0;
          } else if (dataType === 'com.google.distance.delta') {
            distance += point.value[0].fpVal || 0;
          } else if (dataType === 'com.google.active_minutes') {
            activeMinutes += point.value[0].intVal || 0;
          }
        });
      });

      return {
        date: date.toISOString().split('T')[0],
        steps,
        calories: Math.round(calories),
        distance: (distance / 1000).toFixed(2), // Convert meters to km
        activeMinutes
      };
    }).filter(data => data.steps > 0 || data.calories > 0); // Filter empty days
  }

  /**
   * Process heart rate data buckets
   */
  processHeartRateData(buckets) {
    return buckets.map(bucket => {
      const timestamp = new Date(parseInt(bucket.startTimeMillis));
      const heartRates = [];

      bucket.dataset.forEach(dataset => {
        dataset.point.forEach(point => {
          if (point.dataTypeName === 'com.google.heart_rate.bpm') {
            const hr = point.value[0].fpVal || 0;
            if (hr > 0) {
              heartRates.push(hr);
            }
          }
        });
      });

      // Calculate average heart rate for this bucket
      const avgHeartRate = heartRates.length > 0
        ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
        : 0;

      return {
        timestamp: timestamp.toISOString(),
        heartRate: avgHeartRate,
        min: heartRates.length > 0 ? Math.min(...heartRates) : 0,
        max: heartRates.length > 0 ? Math.max(...heartRates) : 0,
        samples: heartRates.length
      };
    }).filter(data => data.heartRate > 0);
  }

  /**
   * Process sleep sessions
   */
  processSleepData(sessions) {
    return sessions.map(session => {
      const startTime = parseInt(session.startTimeMillis);
      const endTime = parseInt(session.endTimeMillis);
      const durationMs = endTime - startTime;
      const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);

      return {
        date: new Date(startTime).toISOString().split('T')[0],
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        durationHours: parseFloat(durationHours),
        durationMinutes: Math.round(durationMs / (1000 * 60))
      };
    });
  }

  /**
   * Check authentication status
   */
  checkAuthStatus() {
    if (!window.gapi || !window.gapi.auth2) {
      return { 
        isAuthenticated: false, 
        isInitialized: this.isInitialized 
      };
    }

    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      this.isAuthenticated = authInstance.isSignedIn.get();

      return { 
        isAuthenticated: this.isAuthenticated,
        isInitialized: this.isInitialized
      };
    } catch (error) {
      return { 
        isAuthenticated: false,
        isInitialized: false
      };
    }
  }

  /**
   * Get user profile info
   */
  getUserProfile() {
    try {
      if (!this.isAuthenticated) {
        return null;
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = authInstance.currentUser.get();
      const profile = user.getBasicProfile();

      return {
        id: profile.getId(),
        name: profile.getName(),
        email: profile.getEmail(),
        imageUrl: profile.getImageUrl()
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new GoogleFitService();
