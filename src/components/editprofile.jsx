import React, { useEffect, useState } from "react";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
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
  const [isSaving, setIsSaving] = useState(false);
  const dispatch = useDispatch();

  const handleSaveChanges = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");

    // Basic validation
    if (!firstName || firstName.trim().length === 0) {
      setError("First name is required");
      return;
    }

    if (age !== "" && (Number.isNaN(Number(age)) || Number(age) < 13 || Number(age) > 120)) {
      setError("Please enter a valid age between 13 and 120");
      return;
    }

    if (photoUrl) {
      try {
        // eslint-disable-next-line no-new
        new URL(photoUrl);
      } catch (_) {
        setError("Please enter a valid Photo URL");
        return;
      }
    }

    setIsSaving(true);
    try {
      const fetchuser = await axios.patch(
        BASE_URL + "/profile/edit",
        {
          firstName,
          lastName,
          age: age === "" ? undefined : Number(age),
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
      setError(
        err?.response?.data?.message || err?.response?.data || err?.message || "Something went wrong"
      );
    } finally {
      setIsSaving(false);
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
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-10 px-4 overflow-x-hidden">
        <div className="flex flex-col items-center justify-center mt-6 mb-8 w-full max-w-xl">
          <div className="w-full max-w-md sm:max-w-lg p-8 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20 transition-all duration-300 hover:shadow-blue-500/30">
            <h2 className="text-3xl font-extrabold text-center text-white mb-8 tracking-wide">
              User Profile
            </h2>
            <form onSubmit={handleSaveChanges} noValidate>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label htmlFor="firstName" className="block mb-1 text-sm font-medium text-gray-200">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 sm:py-2 border border-gray-500 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    placeholder="First Name"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="lastName" className="block mb-1 text-sm font-medium text-gray-200">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 sm:py-2 border border-gray-500 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label htmlFor="age" className="block mb-1 text-sm font-medium text-gray-200">
                    Age
                  </label>
                  <input
                    id="age"
                    type="number"
                    inputMode="numeric"
                    min="13"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 sm:py-2 border border-gray-500 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    placeholder="Age"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="gender" className="block mb-1 text-sm font-medium text-gray-200">
                    Gender
                  </label>
                  <select
                    id="gender"
                    value={gender ?? ""}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 sm:py-2 border border-gray-500 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  >
                    <option
                      value="" className="bg-gray-800 text-white" disabled
                    >
                      Select your gender
                    </option>
                    <option value="male" className="bg-gray-800 text-white">Male</option>
                    <option value="female" className="bg-gray-800 text-white">Female</option>
                    <option value="other" className="bg-gray-800 text-white">Other</option>
                  </select>
                </div>
              </div>

              {/* Remaining fields */}
              <div className="mb-4">
                <label htmlFor="photoUrl" className="block mb-1 text-sm font-medium text-gray-200">
                  Photo URL
                </label>
                <input
                  id="photoUrl"
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-4 py-3 sm:py-2 border border-gray-500 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  placeholder="Photo URL"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="about" className="block mb-1 text-sm font-medium text-gray-200">
                  About
                </label>
                <textarea
                  id="about"
                  className="w-full px-4 py-3 sm:py-2 border border-gray-500 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  placeholder="About"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
              </div>

              <p className="text-red-500 text-1xl mb-2 min-h-6" role="alert" aria-live="polite">{error}</p>
              <button
                type="submit"
                disabled={isSaving}
                className={`w-full py-3 sm:py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-medium shadow-lg hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
        <div className="w-full max-w-xl px-4 lg:px-0 lg:w-auto lg:max-w-none lg:mt-10">
          <UserCard
            user={{ firstName, lastName, age, gender, photoUrl, about }}
          />
        </div>
      </div>
    </>
  );
};

export default EditProfile;
