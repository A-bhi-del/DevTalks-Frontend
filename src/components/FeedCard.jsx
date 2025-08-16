import React from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";

const FeedCard = ({ user }) => {
  const interestedOrignored = async (status, toUserId) => {
    try {
      await axios.post(
        `${BASE_URL}/request/send/${status}/${toUserId}`,
        {},
        {
          withCredentials: true,
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative w-80 max-w-sm rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-105 bg-gradient-to-br from-gray-800 via-gray-900 to-black">
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
            className="flex-1 py-2 px-4 bg-red-500 rounded-xl text-white font-semibold hover:bg-red-600 transition duration-300"
          >
            Ignore
          </button>
          <button
            onClick={() => interestedOrignored("interested", user._id)}
            className="flex-1 py-2 px-4 bg-green-500 rounded-xl text-white font-semibold hover:bg-green-600 transition duration-300"
          >
            Interested
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedCard;
