import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { removefeed } from "../utils/feedSlice";

const FeedCard = ({ user, onCardAction }) => {
  const dispatch = useDispatch();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  
  const interestedOrignored = async (status, toUserId) => {
    if (isProcessing || isHidden) return; // Prevent multiple clicks
    
    setIsProcessing(true);
    try {
      // Temporarily disable notification creation until backend is deployed
      // if (status === "interested") {
      //   // Create notification for interested user
      //   await axios.post(
      //     `${BASE_URL}/notifications/create-interest`,
      //     {
      //       toUserId: toUserId,
      //       title: "Someone is interested in you!",
      //       message: "Check your notifications to see who's interested"
      //     },
      //     {
      //       withCredentials: true,
      //     }
      //   );
      // }

      // Send the original request
      await axios.post(
        `${BASE_URL}/request/send/${status}/${toUserId}`,
        {},
        {
          withCredentials: true,
        }
      );

      // Immediately hide the card
      setIsHidden(true);
      
      // Remove from Redux store after a short delay
      setTimeout(() => {
        dispatch(removefeed(toUserId));
        if (onCardAction) {
          onCardAction();
        }
      }, 200);
      
    } catch (err) {
      console.error(err);
      setIsProcessing(false); // Reset on error
    }
  };

  // Don't render if hidden
  if (isHidden) {
    return null;
  }

  return (
    <div className={`relative w-80 max-w-sm rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-105 bg-gradient-to-br from-gray-800 via-gray-900 to-black ${
      isProcessing ? 'opacity-50 scale-95' : ''
    }`}>
      <div className="h-64 w-full overflow-hidden relative">
        <img
          src={user.photoUrl}
          alt={`${user.firstName} ${user.lastName}`}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      </div>

      <div className="p-4 text-white">
        <h2 className="text-2xl font-bold mb-1">
          {user.firstName} {user.lastName}
        </h2>
        <p className="text-sm text-gray-300 mb-2">
          {user.age} • {user.gender}
        </p>
        <p className="text-gray-200 mb-4 line-clamp-3">{user.about}</p>

        <div className="flex gap-3 mt-2">
          <button
            onClick={() => interestedOrignored("ignored", user._id)}
            disabled={isProcessing}
            className={`flex-1 py-2 px-4 rounded-xl text-white font-semibold transition duration-300 ${
              isProcessing 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Ignore'}
          </button>
          <button
            onClick={() => interestedOrignored("interested", user._id)}
            disabled={isProcessing}
            className={`flex-1 py-2 px-4 rounded-xl text-white font-semibold transition duration-300 ${
              isProcessing 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Interested'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedCard;