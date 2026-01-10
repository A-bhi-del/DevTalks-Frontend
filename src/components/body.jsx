import React, { useEffect } from 'react'
import Navbar from './navbar'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { BASE_URL } from '../utils/constants'
import { useDispatch, useSelector } from 'react-redux'
import { addUser } from '../utils/userSlice'
import axios from 'axios'

const Body = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const userData = useSelector((store) => store.user);
  
  // Check if current route is message page
  const isMessagePage = location.pathname.startsWith('/message/');

  // Check if user is properly authenticated
  const checkAuthentication = async () => {
    try {
      console.log("🔐 Checking authentication...");
      console.log("🍪 Current cookies:", document.cookie);
      console.log("👤 Current user from localStorage:", JSON.parse(localStorage.getItem('user') || 'null'));
      
      const res = await axios.get(BASE_URL + "/profile/view", {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log("✅ Authentication successful:", res.data);
      return res.data;
    } catch (err) {
      // Network errors - don't treat as authentication failure
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        console.log("⚠️ Network error during authentication check - server might be down");
        console.log("⚠️ Will keep user logged in (might be temporary network issue)");
        // Return a flag indicating network error instead of null
        return { _networkError: true };
      }
      
      // Authentication errors
      if (err.response?.status === 401) {
        console.log("❌ Authentication failed: 401 Unauthorized");
        console.log("🔍 Error details:", err.response?.data);
        return null;
      }
      
      // Other errors
      console.log("❌ Authentication check error:", err.response?.status);
      console.log("🔍 Error details:", err.response?.data);
      return null;
    }
  };

  const fetchUser = async () => {
    console.log("=== BODY COMPONENT - fetchUser called ===");
    console.log("Current userData from Redux:", userData);
    console.log("BASE_URL:", BASE_URL);

    // On page refresh, Redux state is cleared, so check localStorage first
    const localUser = JSON.parse(localStorage.getItem('user') || 'null');
    console.log("💾 User from localStorage:", localUser);
    
    // If Redux doesn't have user but localStorage does, restore from localStorage
    if (!userData && localUser && localUser._id) {
      console.log("🔄 Restoring user from localStorage to Redux...");
      dispatch(addUser(localUser));
      console.log("✅ User restored from localStorage");
    }

    // Get current user (either from Redux or localStorage)
    const currentUser = userData || localUser;
    
    if(currentUser && currentUser._id) {
      console.log("✅ User found in state/localStorage");
      console.log("👤 User ID:", currentUser._id);
      console.log("👤 User Name:", currentUser.firstName, currentUser.lastName);
      console.log("🍪 Current cookies:", document.cookie);
      
      // On page refresh, don't immediately check authentication
      // Trust localStorage and let user continue - authentication will be checked
      // when they try to use features that require API calls
      console.log("✅ User data restored - authentication will be verified on next API call");
      console.log("✅ User can continue using app without redirect");
      return; // Exit early - don't check authentication on refresh
    }

    // No user in Redux or localStorage - try to fetch from API
    try{
      console.log("🌐 No user in state/localStorage, making API call to:", BASE_URL + "/profile/view");
      console.log("🍪 Cookies:", document.cookie);
      
      const res = await axios.get(BASE_URL + "/profile/view", {
        withCredentials : true,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log("✅ Profile API response:", res.data);
      dispatch(addUser(res.data));
      localStorage.setItem('user', JSON.stringify(res.data));
    }catch(err){
      console.error("❌ Profile API error:", err);
      console.error("🔍 Error status:", err.response?.status);
      console.error("📝 Error message:", err.response?.data);

      if(err.response?.status === 401 || err.code === 'ERR_NETWORK'){
        console.log("🔐 User not authenticated or server not available");
        // Only redirect to login if we're not already on login page
        if (location.pathname !== '/login' && location.pathname !== '/signup') {
          console.log("🔄 Redirecting to login...");
          navigate("/login");
        }
      } else {
        console.log("🔥 Other error occurred:", err.message);
      }
    }
  }

  useEffect(() => {
    fetchUser(); // ye site ke load hote hai.. sabse pahle authontication check krega if you are not authenticated than login page par navigate kr dega
  }, [])
  
  return (
    <div className='bg-gradient-to-br from-gray-900 via-black to-gray-800 '>
      {!isMessagePage && <Navbar/>}
      <Outlet/>
    </div>
  )
}

export default Body
