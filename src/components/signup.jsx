import React from "react";
import axios from "axios";

import { useState } from "react";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addUser } from "../utils/userSlice";

const SignUpPage = () => {
  const [firstName, setFirstName] = useState();
  const [lastName, setLastName] = useState();
  const [emailId, setEmailId] = useState();
  const [password, setPassword] = useState();
  const [age, setAge] = useState();
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        BASE_URL + "/signup",
        {
          firstName,
          lastName,
          age,
          emailId,
          password,
        },
        {
          withCredentials: true,
        }
      );
      console.log(res.data);
      if (res?.data?.token) {
        try { localStorage.setItem('token', res.data.token); } catch {}
      }
      dispatch(addUser(res.data.data));
      return navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 p-5">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-10 rounded-2xl shadow-2xl w-full max-w-md transition-all duration-300 hover:shadow-blue-500/30">
        <h2 className="text-center text-3xl font-extrabold text-white mb-8 tracking-wide">
          Sign Up
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-500 bg-white/10 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              placeholder="First name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-500 bg-white/10 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              placeholder="Last name"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Age
          </label>
          <input
            type="number"
            min="13"
            max="120"
            value={age}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-3 py-2 border border-gray-500 bg-white/10 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            placeholder="Enter your age"
            required
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Email
          </label>
          <input
            type="emailId"
            value={emailId}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            onChange={(e) => setEmailId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-500 bg-white/10 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-500 bg-white/10 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          onClick={handleSubmit}
          
          className="mt-6 w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 px-4 rounded-lg font-medium tracking-wide shadow-lg hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300"
        >
          Sign Up
        </button>

        <p className="text-center mt-6 text-gray-400">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-blue-400 hover:text-blue-300 font-medium transition duration-200"
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
