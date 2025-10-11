import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Auto-login by fetching first user from the database
export const autoLogin = createAsyncThunk(
  'user/autoLogin',
  async (_, { rejectWithValue }) => {
    try {
      // Fetch users from the backend API
      const response = await fetch('http://127.0.0.1:8001/api/users/list');
      if (!response.ok) {
        throw new Error('Failed to fetch users from API');
      }
      
      const users = await response.json();
      
      // Extract users array from response
      const usersList = users.users || [];
      
      // If we have users, use the first one for auto-login
      if (usersList && usersList.length > 0) {
        const user = usersList[0];
        
        // Convert MongoDB _id to id for frontend consistency
        const normalizedUser = {
          id: user.id || user._id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          is_active: user.is_active
        };
        
        // Store in localStorage for persistence
        localStorage.setItem('currentUser', JSON.stringify(normalizedUser));
        
        return normalizedUser;
      } else {
        // If no users exist, create a demo user via API
        const demoUserData = {
          email: "demo@example.com",
          username: "demo_user",
          full_name: "Demo User",
          password: "demo123"
        };
        
        const registerResponse = await fetch('http://127.0.0.1:8001/api/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(demoUserData)
        });
        
        if (!registerResponse.ok) {
          throw new Error('Failed to create demo user');
        }
        
        const newUser = await registerResponse.json();
        
        // Convert for consistency
        const normalizedUser = {
          id: newUser.id || newUser._id,
          email: newUser.email,
          username: newUser.username,
          full_name: newUser.full_name,
          is_active: newUser.is_active
        };
        
        localStorage.setItem('currentUser', JSON.stringify(normalizedUser));
        return normalizedUser;
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Refresh user data from API
export const refreshUserData = createAsyncThunk(
  'user/refreshUserData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user } = getState();
      const currentUser = user.currentUser;
      
      if (!currentUser || !currentUser.id) {
        throw new Error('No current user to refresh');
      }
      
      // Fetch updated user data from API
      const response = await fetch(`http://127.0.0.1:8001/api/users/${currentUser.id}`);
      if (!response.ok) {
        // If specific user not found, try to get first user from list
        const usersResponse = await fetch('http://127.0.0.1:8001/api/users/list');
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        const users = await usersResponse.json();
        if (users && users.users && users.users.length > 0) {
          const user = users.users[0];
          return {
            id: user.id || user._id,
            email: user.email,
            username: user.username,
            full_name: user.full_name,
            is_active: user.is_active
          };
        }
        throw new Error('No users found');
      }
      
      const userData = await response.json();
      
      // Normalize the response
      const normalizedUser = {
        id: userData.id || userData._id,
        email: userData.email,
        username: userData.username,
        full_name: userData.full_name,
        is_active: userData.is_active
      };
      
      // Update localStorage
      localStorage.setItem('currentUser', JSON.stringify(normalizedUser));
      
      return normalizedUser;
    } catch (error) {
      console.error('Refresh user data failed:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Get user data from API
export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://127.0.0.1:8001/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const userData = await response.json();
      return userData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
    loading: false,
    error: null,
    isAuthenticated: false,
  },
  reducers: {
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      localStorage.removeItem('currentUser');
    },
    refreshUser: (state) => {
      // This will trigger a refresh of user data from the API
      state.loading = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    loadUserFromStorage: (state) => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        state.currentUser = JSON.parse(storedUser);
        state.isAuthenticated = true;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Auto-login
      .addCase(autoLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(autoLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(autoLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Fetch user data
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = { ...state.currentUser, ...action.payload };
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Refresh user data
      .addCase(refreshUserData.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.error = null;
      })
      .addCase(refreshUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, loadUserFromStorage, refreshUser } = userSlice.actions;
export default userSlice.reducer;