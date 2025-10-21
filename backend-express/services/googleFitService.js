/**
 * Backend Google Fit Service
 * Handles Google Fit API authentication and data fetching on the server side
 */

const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class GoogleFitBackendService {
  constructor() {
    this.oauth2Client = null;
    this.fitness = null;
    this.isInitialized = false;
    
    // Load credentials from environment
    this.clientId = process.env.GOOGLE_FIT_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_FIT_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOOGLE_FIT_REDIRECT_URI || 'http://localhost:8001/api/health/google-fit/callback';
  }

  /**
   * Initialize Google OAuth2 client
   */
  initialize() {
    try {
      if (!this.clientId || !this.clientSecret) {
        console.warn('⚠️ Google Fit credentials not configured');
        return false;
      }

      this.oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri
      );

      this.fitness = google.fitness({
        version: 'v1',
        auth: this.oauth2Client
      });

      this.isInitialized = true;
      console.log('✅ Google Fit Backend Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Google Fit service:', error);
      return false;
    }
  }

  /**
   * Generate authentication URL for user to grant access
   */
  getAuthUrl() {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    const scopes = [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.heart_rate.read',
      'https://www.googleapis.com/auth/fitness.body.read',
      'https://www.googleapis.com/auth/fitness.sleep.read',
      'https://www.googleapis.com/auth/fitness.location.read'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for access token
   */
  async getTokenFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(accessToken) {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }
    this.oauth2Client.setCredentials({ access_token: accessToken });
  }

  /**
   * Fetch activity data from Google Fit
   */
  async fetchActivityData(startDate, endDate) {
    try {
      if (!this.isInitialized) {
        throw new Error('Google Fit service not initialized');
      }

      const startTimeMillis = new Date(startDate).getTime();
      const endTimeMillis = new Date(endDate).getTime();

      // Fetch steps data
      const stepsResponse = await this.fitness.users.dataset.aggregate({
        userId: 'me',
        requestBody: {
          aggregateBy: [{
            dataTypeName: 'com.google.step_count.delta'
          }],
          bucketByTime: { durationMillis: 86400000 }, // 1 day
          startTimeMillis,
          endTimeMillis
        }
      });

      // Fetch calories data
      const caloriesResponse = await this.fitness.users.dataset.aggregate({
        userId: 'me',
        requestBody: {
          aggregateBy: [{
            dataTypeName: 'com.google.calories.expended'
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis,
          endTimeMillis
        }
      });

      // Fetch heart rate data
      const heartRateResponse = await this.fitness.users.dataset.aggregate({
        userId: 'me',
        requestBody: {
          aggregateBy: [{
            dataTypeName: 'com.google.heart_rate.bpm'
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis,
          endTimeMillis
        }
      });

      // Fetch distance data
      const distanceResponse = await this.fitness.users.dataset.aggregate({
        userId: 'me',
        requestBody: {
          aggregateBy: [{
            dataTypeName: 'com.google.distance.delta'
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis,
          endTimeMillis
        }
      });

      // Process and combine data
      const processedData = this.processGoogleFitData({
        steps: stepsResponse.data,
        calories: caloriesResponse.data,
        heartRate: heartRateResponse.data,
        distance: distanceResponse.data
      });

      return processedData;
    } catch (error) {
      console.error('Error fetching Google Fit activity data:', error);
      throw error;
    }
  }

  /**
   * Process raw Google Fit API response into usable format
   */
  processGoogleFitData(rawData) {
    const dailyData = [];
    
    // Assuming all data sources have the same buckets
    const buckets = rawData.steps?.bucket || [];

    buckets.forEach((bucket, index) => {
      const date = new Date(parseInt(bucket.startTimeMillis));
      const dateStr = date.toISOString().split('T')[0];

      // Extract steps
      const stepsDataset = bucket.dataset?.[0]?.point?.[0];
      const steps = stepsDataset?.value?.[0]?.intVal || 0;

      // Extract calories
      const caloriesBucket = rawData.calories?.bucket?.[index];
      const caloriesDataset = caloriesBucket?.dataset?.[0]?.point?.[0];
      const calories = caloriesDataset?.value?.[0]?.fpVal || 0;

      // Extract heart rate
      const heartRateBucket = rawData.heartRate?.bucket?.[index];
      const heartRatePoints = heartRateBucket?.dataset?.[0]?.point || [];
      const heartRates = heartRatePoints.map(p => p.value?.[0]?.fpVal || 0);
      const heartRateAvg = heartRates.length > 0 
        ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length 
        : 0;

      // Extract distance
      const distanceBucket = rawData.distance?.bucket?.[index];
      const distanceDataset = distanceBucket?.dataset?.[0]?.point?.[0];
      const distance = (distanceDataset?.value?.[0]?.fpVal || 0) / 1000; // Convert to km

      dailyData.push({
        date: dateStr,
        summary: {
          steps: Math.round(steps),
          calories: Math.round(calories),
          distance: parseFloat(distance.toFixed(2)),
          heartRateAvg: Math.round(heartRateAvg),
          heartRateMin: Math.round(Math.min(...heartRates)),
          heartRateMax: Math.round(Math.max(...heartRates))
        }
      });
    });

    return dailyData;
  }

  /**
   * Get user profile information
   */
  async getUserProfile() {
    try {
      const oauth2 = google.oauth2({
        version: 'v2',
        auth: this.oauth2Client
      });

      const { data } = await oauth2.userinfo.get();
      
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        imageUrl: data.picture
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new GoogleFitBackendService();
