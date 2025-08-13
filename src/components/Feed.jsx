import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";

export default function FeedPage() {
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleConnectionreqsend = async (status, touserId) => {
    try {
      await axios.post(
        `${BASE_URL}/request/send/${status}/${touserId}`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const fetchuserdata = async () => {
    try {
      const user = await axios.get(BASE_URL + "/user/feed", {
        withCredentials: true,
      });
      setUsers(user.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchuserdata();
  }, []);

  const nextUser = () => {
    setCurrentIndex((prev) => (prev + 1) % users.length);
  };

  const prevUser = () => {
    setCurrentIndex((prev) => (prev === 0 ? users.length - 1 : prev - 1));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6">
      <h1 className="text-3xl font-extrabold text-white mb-6 tracking-wide">
        Discover People
      </h1>

      {users.length === 0 ? (
        <p className="text-gray-400">No users found.</p>
      ) : (
        <div className="relative w-80 h-[450px]">
          {users.map((u, index) => (
            <div
              key={u._id}
              className={`absolute inset-0 transition-all duration-500 ${
                index === currentIndex
                  ? "opacity-100 z-20 scale-100"
                  : "opacity-0 z-10 scale-90"
              }`}
            >
              <div
                className="absolute w-full h-full rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 bg-center bg-cover"
                style={{
                  backgroundImage: `url(${u.photoUrl})`,
                }}
              >
                <div className="absolute bottom-0 bg-gradient-to-t from-black/70 to-transparent w-full p-4 text-white">
                  <h2 className="text-xl font-bold">
                    {u.firstName + " " + u.lastName}
                  </h2>
                  <p className="text-sm text-gray-200">{u.about}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Buttons */}
      {users.length > 1 && (
        <div className="flex gap-4 mt-6">
          <button
            onClick={prevUser}
            className="px-5 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
          >
            ⬅ Prev
          </button>
          <button
            onClick={nextUser}
            className="px-5 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
          >
            Next ➡
          </button>
        </div>
      )}

      {/* Interested / Ignored Buttons */}
      {users.length > 0 && (
        <div className="flex gap-6 mt-4">
          <button
            className="px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold"
            onClick={() =>
              handleConnectionreqsend("interested", users[currentIndex]._id)
            }
          >
            Interested
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold"
            onClick={() =>
              handleConnectionreqsend("ignored", users[currentIndex]._id)
            }
          >
            Ignored
          </button>
        </div>
      )}
    </div>
  );
}
