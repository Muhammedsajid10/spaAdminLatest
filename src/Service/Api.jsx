import axios from 'axios';
import { Base_url } from './Base_url';

const api = axios.create({
  baseURL: Base_url,
  withCredentials: true, // if using cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Global state to prevent multiple simultaneous login attempts
let loginInProgress = false;
let loginPromise = null;

// Function to perform automatic demo login
const performDemoLogin = async () => {
  // If login is already in progress, wait for it
  if (loginInProgress && loginPromise) {
    console.log('⏳ Login already in progress, waiting...');
    return await loginPromise;
  }

  loginInProgress = true;
  loginPromise = new Promise(async (resolve) => {
    try {
      console.log('🔄 Attempting real login with backend...');
      
      // Clear any old token first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Add delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
      
      // Use axios directly with proper headers to avoid circular dependency with api instance
      const loginData = JSON.stringify({
        email: 'admin@spa.com',
        password: 'Admin@123'
      });
      
      const response = await axios({
        method: 'post',
        url: `${Base_url}/auth/login`,
        data: loginData,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });

      if (response.data.success) {
        const token = response.data.token; // Token is at top level, not in data.token
        const user = response.data.data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ Demo login successful! Fresh token acquired.');
        console.log('👤 User:', user.fullName, '(', user.role, ')');
        if (user.role !== 'admin') {
          console.warn('⚠️ Demo login did NOT return an admin user! Role:', user.role);
        }
        loginInProgress = false;
        loginPromise = null;
        resolve(token);
      } else {
        console.log('❌ Demo login failed:', response.data.message);
        loginInProgress = false;
        loginPromise = null;
        resolve(null);
      }
    } catch (error) {
      loginInProgress = false;
      loginPromise = null;
      
      if (error.response?.status === 429) {
        console.log('⏳ Rate limited - using mock data mode');
        // Set a flag to indicate we should use mock data
        localStorage.setItem('useMockData', 'true');
        resolve(null);
      } else {
        console.log('❌ Demo login error:', error.response?.data?.message || error.message);
        resolve(null);
      }
    }
  });

  return await loginPromise;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    console.log(`🔄 Making API request to: ${config.url}`);
    
    // Check if we should use mock data due to rate limiting
    if (localStorage.getItem('useMockData') === 'true') {
      console.log('🔧 Mock data mode detected - attempting to clear and retry...');
      // Clear mock data flag and try again
      localStorage.removeItem('useMockData');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('✅ Mock data mode cleared - proceeding with real API calls');
    }

    let token = localStorage.getItem('token');
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {}

    // If no token exists and no login in progress, try to perform demo login
    if (!token && !loginInProgress) {
      console.log('No token found, attempting demo login...');
      token = await performDemoLogin();
      user = JSON.parse(localStorage.getItem('user'));
    }

    if (token) {
      if (user?.role !== 'admin') {
        console.warn('⚠️ Token exists but user is not admin! Role:', user?.role);
      }
      console.log('✅ Adding token to request headers');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('❌ No token available for request');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API request successful: ${response.config.url}`, response.data);
    return response;
  },
  async (error) => {
    console.log(`❌ API request failed: ${error.config?.url}`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    // Handle cancelled requests (mock data mode)
    if (axios.isCancel(error)) {
      console.log('🔧 Request cancelled for mock data mode');
      return Promise.reject(new Error('MOCK_DATA_MODE'));
    }

    if (error.response?.status === 401) {
      console.log('❌ 401 Unauthorized - Token invalid');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Don't retry if we're already rate limited
      if (localStorage.getItem('useMockData') !== 'true' && !loginInProgress) {
        console.log('🔄 Attempting to get new token...');
        const newToken = await performDemoLogin();
        if (newToken) {
          // Retry the original request with the new token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          console.log('🔄 Retrying original request with new token...');
          return api(error.config);
        }
      }
    } else if (error.response?.status === 429) {
      console.log('⏳ Rate limited - switching to mock data mode');
      localStorage.setItem('useMockData', 'true');
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Export utility function to reset mock data mode
export const resetMockDataMode = () => {
  localStorage.removeItem('useMockData');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('🔄 Mock data mode reset - will attempt real API calls again');
};

// Export utility function to force fresh login
export const forceRefreshToken = async () => {
  console.log('🔄 Forcing fresh token refresh...');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('useMockData');
  
  // Reset global state
  loginInProgress = false;
  loginPromise = null;
  
  // Perform fresh login
  const token = await performDemoLogin();
  return token;
}; 