import React from "react";

const UserCard = ({ user }) => {
  return (
    <div className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-300 md:hover:scale-105 bg-gradient-to-br from-gray-800 via-gray-900 to-black">
      
      {/* Profile Image */}
      <div className="h-64 w-full overflow-hidden relative">
        <img
          src={user.photoUrl || "https://via.placeholder.com/150"}
          alt={`${user.firstName} ${user.lastName}`}
          className="w-full h-full object-cover"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      </div>

      {/* Card Content */}
      <div className="p-4 text-white">
        <h2 className="text-2xl font-bold mb-1">{user.firstName} {user.lastName}</h2>
        <p className="text-sm text-gray-300 mb-2">{user.age} • {user.gender}</p>
        <p className="text-gray-200 mb-4 line-clamp-3">{user.about}</p>

        {/* Action Buttons */}
      </div>
    </div>
  );
};

export default UserCard;
