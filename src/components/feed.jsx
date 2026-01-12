import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addfeed } from "../utils/feedSlice";
import FeedCard from "./feedcard";

const FeedPage = () => {
  const feed = useSelector((store) => store.feed);
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);

  const getFeed = async () => {
    console.log("=== getFeed function called ===");
    try {
      // Check both Redux and localStorage for user
      const localUser = JSON.parse(localStorage.getItem('user') || 'null');
      const currentUser = user || localUser;
      
      if (!currentUser || !currentUser._id) {
        return;
      }
      
      if (feed && feed.length > 0) {
        return;
      }
      
      
      const res = await axios.get(BASE_URL + "/user/feed", {
        withCredentials: true,
      });
            
      // Backend returns {users: [...], hasMore: true, page: 1, totalHidden: 5}
      // We need to dispatch only the users array
      console.log("📤 Dispatching users to Redux:", res.data.users);
      dispatch(addfeed(res.data.users || []));
    } catch (err) {
      console.error("Error fetching feed:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      if (err.response?.status === 401) {
        dispatch(addfeed([]));
      } else if (err.response?.status === 500) {
        console.log("Server error - check backend logs");
      }
    }
  };

  useEffect(() => {
    // On page refresh, Redux state might be cleared, so check localStorage first
    const localUser = JSON.parse(localStorage.getItem('user') || 'null');    
    // Get current user (either from Redux or localStorage)
    const currentUser = user || localUser;
    // Check if user is properly authenticated
    if (!currentUser || !currentUser._id) {
      // Don't redirect immediately - body.jsx will handle it
      // This prevents race conditions on page refresh
      return;
    }
    
    // If we have user in localStorage but not in Redux, it will be restored by body.jsx
    // Just wait a bit for the restoration
    if (!user && localUser) {
      // Wait a bit for body.jsx to restore user
      const timeout = setTimeout(() => {
        if (!user) {
          console.log("⚠️ User still not in Redux after wait, but localStorage has user");
          console.log("✅ Proceeding with localStorage user for now");
          // User will be in Redux soon, just proceed
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
    getFeed();
  }, [user, feed]); // Add dependencies

  // Adjust currentIndex when feed changes (when a card is removed)
  useEffect(() => {
    if (feed && feed.length > 0) {
      // If currentIndex is beyond the array length, adjust it
      if (currentIndex >= feed.length) {
        setCurrentIndex(feed.length - 1);
      }
      // If we're at the last card and it gets removed, go to previous
      if (currentIndex >= feed.length && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  }, [feed.length, currentIndex]);

  useEffect(() => {
    if (!feed) return;    // If feed becomes empty, reset index to 0
    if (feed.length === 0) {
      setCurrentIndex(0);
      return;
    }

   // If currentIndex is beyond the array length, clamp it
    if (currentIndex >= feed.length) {
      setCurrentIndex(Math.max(feed.length - 1, 0));
    }
  }, [feed, currentIndex]);

  const handleCardAction = () => {
    // When a card is interested/ignored, the card is removed from the array
    // Force a re-render to show the next user
    console.log('Card action triggered, current index:', currentIndex, 'feed length:', feed.length);
    setForceUpdate(prev => prev + 1);
  };

  // Debug info
  console.log("Current feed state:", feed);
  console.log("Feed length:", feed?.length);
  console.log("Current index:", currentIndex);

  // Force refresh function
  const forceRefreshFeed = () => {
    console.log("🔄 Force refreshing feed...");
    dispatch(addfeed([])); // Clear current feed
    getFeed(); // Fetch new feed
  };

  // Show login required if user not logged in (check both Redux and localStorage)
  const localUser = JSON.parse(localStorage.getItem('user') || 'null');
  const currentUser = user || localUser;
  
  if (!currentUser || !currentUser._id) {
    // Don't show login screen immediately - body.jsx will handle redirect
    // Just show loading or wait
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-4">
        <div className="text-center">
          <div className="text-8xl mb-6">⏳</div>
          <h2 className="text-3xl font-bold mb-4">Loading...</h2>
          <p className="text-gray-300 text-lg mb-6">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no more cards
  if (!feed || feed.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-4">
        <div className="text-center">
          <div className="text-8xl mb-6">😔</div>
          <h2 className="text-3xl font-bold mb-4">No profiles found!</h2>
          <p className="text-gray-300 text-lg mb-6">No users available in your feed. This could be because:</p>
          <ul className="text-gray-400 text-sm mb-6 text-left max-w-md">
            <li>• All users are already connected to you</li>
            <li>• You need to refresh the feed</li>
            <li>• There are no other users in the database</li>
            <li>• Authentication issue</li>
          </ul>
          <button
            onClick={forceRefreshFeed}
            className="px-6 py-3 bg-blue-600 rounded-xl text-white font-semibold hover:bg-blue-700 transition duration-300 mb-4"
          >
            🔄 Refresh Feed
          </button>
          <div className="text-xs text-gray-500 mb-4">
            Check console for detailed logs
          </div>
          <div className="mb-4 p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">Debug Info:</p>
            <p className="text-sm">Feed: {JSON.stringify(feed)}</p>
            <p className="text-sm">User: {user ? user.firstName : 'Not logged in'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-4">
      
      <FeedCard 
        key={`${feed[currentIndex]?._id}-${currentIndex}-${forceUpdate}`} 
        user={feed[currentIndex]} 
        onCardAction={handleCardAction} 
      />
      
    </div>
  );
};

export default FeedPage;
