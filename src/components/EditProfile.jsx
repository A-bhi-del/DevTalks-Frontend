import React, { useEffect, useState } from "react";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import FeedCard from "./feedcard";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserCard from "./usercard";
import { addUser } from "../utils/userSlice";

const EditProfile = () => {
  const user = useSelector((store) => store.user);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [about, setAbout] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");

  const [showtoast, setShowtoast] = useState(false);
  const dispatch = useDispatch();

  const handleSaveChanges = async () => {
    setError("");
    try {
      const fetchuser = await axios.patch(
        BASE_URL + "/profile/edit",
        {
          firstName,
          lastName,
          age,
          about,
          photoUrl,
          gender,
        },
        {
          withCredentials: true,
        }
      );

      dispatch(addUser(fetchuser?.data?.data));
      setShowtoast(true);
      setTimeout(() => {
        setShowtoast(false);
      }, 3000);
    } catch (err) {
      setError(err?.response?.data);
    }
  };

  useEffect(() => {
    setFirstName(user?.firstName);
    setLastName(user?.lastName);
    setAge(user?.age);
    setAbout(user?.about);
    setPhotoUrl(user?.photoUrl);
    setGender(user?.gender);
  }, [user]);

  return (
    <>
     {showtoast && (
        <div className="toast toast-top toast-center">
          <div className="alert alert-success">
            <span>Changes saved successfully.</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-center gap-10">
        <div className="flex flex-col items-center justify-center mt-10 mb-10 w-120 ml-45 ">
          <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20 transition-all duration-300 hover:shadow-blue-500/30">
            <h2 className="text-3xl font-extrabold text-center text-white mb-8 tracking-wide">
              User Profile
            </h2>

            {/* First row: First Name + Last Name */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block mb-1 text-sm font-medium text-gray-200">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-500 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  placeholder="First Name"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-sm font-medium text-gray-200">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-500 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  placeholder="Last Name"
                />
              </div>
            </div>

            {/* Second row: Age + Gender */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block mb-1 text-sm font-medium text-gray-200">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-500 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  placeholder="Age"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-sm font-medium text-gray-200">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-500 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)", // very transparent dark-ish
                    color: "white",
                  }}
                >
                  <option
                    value="" className="bg-gray-800 text-white" disabled
                  >
                    Select your gender
                  </option>
                  <option value="male" className="bg-gray-800 text-white">male</option>
                  <option value="female" className="bg-gray-800 text-white">female</option>
                  <option value="other" className="bg-gray-800 text-white">other</option>
                </select>
              </div>
            </div>

            {/* Remaining fields */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-200">
                Photo URL
              </label>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-500 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                placeholder="Photo URL"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-200">
                About
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-500 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400textarea"
                placeholder="About"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
              />
            </div>

            <p className="text-red-500 text-1xl mb-2">{error}</p>
            <button
              type="submit"
              onClick={handleSaveChanges}
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-medium shadow-lg hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
            >
              Save Changes
            </button>
          </div>
        </div>
        <UserCard
          user={{ firstName, lastName, age, gender, photoUrl, about }}
        />
      </div>
    </>
  );
};

export default EditProfile;
