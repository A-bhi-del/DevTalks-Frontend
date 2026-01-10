import axios from 'axios';
import { BASE_URL } from './constants';

export const refreshToken = async () => {
  try {
    console.log('🔄 Attempting to refresh token...');
    const response = await axios.post(`${BASE_URL}/refresh-token`, {}, {
      withCredentials: true
    });
    
    console.log('✅ Token refreshed successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    throw error;
  }
};

export const handleTokenError = async () => {
  try {
    await refreshToken();
    // Reload the page to get fresh state
    window.location.reload();
  } catch (error) {
    // If refresh fails, redirect to login
    console.log('🔄 Token refresh failed, redirecting to login');
    localStorage.clear();
    window.location.href = '/login';
  }
};