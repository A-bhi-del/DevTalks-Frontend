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
  const isMessagePage = location.pathname.startsWith('/app/message/ ') || location.pathname === '/app/chats' || location.pathname.startsWith('/app/chats/');
 
  const fetchUser = async () => {
    // On page refresh, Redux state is cleared, so check localStorage first
    const localUser = JSON.parse(localStorage.getItem('user') || 'null');
    
    // If Redux doesn't have user but localStorage does, restore from localStorage
    if (!userData && localUser && localUser._id) {
      dispatch(addUser(localUser));
    }

    // Get current user (either from Redux or localStorage)
    const currentUser = userData || localUser;
    
    if(currentUser && currentUser._id) {
      // On page refresh, don't immediately check authentication
      // Trust localStorage and let user continue - authentication will be checked
      // when they try to use features that require API calls
      return; // Exit early - don't check authentication on refresh
    }

    // No user in Redux or localStorage - try to fetch from API
    try{
      const res = await axios.get(BASE_URL + "/profile/view", {
        withCredentials : true,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      dispatch(addUser(res.data));
      localStorage.setItem('user', JSON.stringify(res.data));
    }catch(err){

      if(err.response?.status === 401 || err.code === 'ERR_NETWORK'){
        // Only redirect to login if we're not already on login page
        if (location.pathname !== '/login' && location.pathname !== '/signup') {
          navigate("/login");
        }
      }
    }
  }

  useEffect(() => {
    fetchUser(); // ye site ke load hote hai.. sabse pahle authontication check krega if you are not authenticated than login page par navigate kr dega
  }, [])
  
  return (
    <div className='bg-gradient-to-br from-gray-900 via-black to-gray-800 '>
      {!isMessagePage  && <Navbar/>}
      <Outlet/>
    </div>
  )
}

export default Body
