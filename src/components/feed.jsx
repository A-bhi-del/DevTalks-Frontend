import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addfeed } from "../utils/feedSlice";
import FeedCard from "./feedcard";

const FeedPage = () => {
  const feed = useSelector((store) => store.feed);
  const dispatch = useDispatch();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);

  const getFeed = async () => {
    try {
      if (feed && feed.length > 0) return;
      const res = await axios.get(BASE_URL + "/user/feed", {
        withCredentials: true,
      });
      dispatch(addfeed(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getFeed();
  }, []);

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

  const handleCardAction = () => {
    // When a card is interested/ignored, the card is removed from the array
    // Force a re-render to show the next user
    console.log('Card action triggered, current index:', currentIndex, 'feed length:', feed.length);
    setForceUpdate(prev => prev + 1);
  };

  // Show empty state if no more cards
  if (!feed || feed.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-4">
        <div className="text-center">
          <div className="text-8xl mb-6">💔</div>
          <h2 className="text-3xl font-bold mb-4">No more profiles!</h2>
          <p className="text-gray-300 text-lg mb-6">You've seen all available profiles.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 rounded-xl text-white font-semibold hover:bg-blue-700 transition duration-300"
          >
            Refresh to see more
          </button>
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
