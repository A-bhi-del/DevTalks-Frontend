import axios from 'axios';
import React from 'react'
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addUser } from '../utils/userSlice';
import { Link, useNavigate } from 'react-router-dom';
import { BASE_URL } from '../utils/constants';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const nevigate = useNavigate();

  const handlesubmit = async() => {
    try{
      const res = await axios.post(BASE_URL + "/login", {
        emailId,
        password
      }, {
        withCredentials : true,
      }
    );
    console.log(res.data);
    // Save JWT token if provided for socket auth
    if (res?.data?.token) {
      try { localStorage.setItem('token', res.data.token); } catch {}
    }
    dispatch(addUser(res.data.data));
    return nevigate("/");
    }catch(err){
      setError(err?.response?.data || "Something went wrong");
      // console.error(err);
    }
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
  <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20 transition-all duration-300 hover:shadow-blue-500/30">
    <h2 className="text-3xl font-extrabold text-center text-white mb-8 tracking-wide">
      Login to Your Account
    </h2>

    <div className="mb-4">
      <label className="block mb-1 text-sm font-medium text-gray-200">
        Email
      </label>
      <input
        type="email"
        name="email"
        value={emailId}
        onKeyDown={(e) => e.key === "Enter" && handlesubmit()}
        onChange={(e) => setEmailId(e.target.value)}
        className="w-full px-4 py-2 border border-gray-500 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        placeholder="Enter your email"
      />
    </div>

    <div className="mb-4">
      <label className="block mb-1 text-sm font-medium text-gray-200">
        Password
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          value={password}
          onKeyDown={(e) => e.key === "Enter" && handlesubmit()}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 pr-10 border border-gray-500 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          placeholder="Enter your password"
        />
        <span
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-white"
        >
          {showPassword ? "🙈" : "👁️"}
        </span>
      </div>
    </div>

    <div className="flex justify-between text-sm mb-6 text-gray-300">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="mr-2 accent-blue-500"
        />
        Remember me
      </label>
      <a href="#" className="text-blue-400 hover:text-blue-300 transition duration-200">
        Forgot password?
      </a>
    </div>
    <p className='text-red-500 text-1xl mb-2'>{error}</p>
    <button
      type="submit"
      onClick={handlesubmit}
      
      className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-medium shadow-lg hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300"
    >
      Login
    </button>

    <p className="text-center text-sm text-gray-400 mt-6">
      Don’t have an account?{" "}
      <Link to={"/signup"} className="text-blue-400 hover:text-blue-300 font-medium transition duration-200">
        SignUp
      </Link>
    </p>
  </div>
</div>

  );
}

export default Login
