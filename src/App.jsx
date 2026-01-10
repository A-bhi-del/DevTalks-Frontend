import React, { useEffect } from "react";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Body from "./components/body";
import Login from "./components/login";
import Profile from "./components/profile";
import { Provider, useDispatch } from "react-redux";
import appStore from "./utils/appStore";
import Feed from "./components/feed";
import Signup from "./components/signup";
import Connection from "./components/connection";
import Request from "./components/request";
import Updates from "./components/updates..jsx";
import Message from "./components/message";
import WhatsAppChat from "./components/WhatsAppChat";
import LandingPage from "./components/LandingPage";
import { addUser } from "./utils/userSlice";

function AppContent() {
  const dispatch = useDispatch();

        useEffect(() => {
          // Initialize user from localStorage on app start
          const user = JSON.parse(localStorage.getItem('user') || 'null');
          console.log("App.jsx - localStorage user:", user);
          console.log("App.jsx - Current cookies:", document.cookie);
          
          if (user && user._id) {
            console.log("✅ App.jsx - Valid user found, dispatching to Redux:", user);
            dispatch(addUser(user));
          } else {
            console.log("❌ App.jsx - No valid user in localStorage");
            console.log("🔄 User needs to login");
            // Clear any existing cookies
            document.cookie.split(";").forEach(function(c) { 
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
          }
        }, [dispatch]);

  return (
    <BrowserRouter basename="/">
      <Routes>
        {/* Landing Page - Default Route */}
        <Route path="/" element={<LandingPage />} />
        
        {/* App Routes with Body Layout */}
        <Route path="/app" element={<Body />}>
          <Route path="/app" element={<Feed/>}/>
          <Route path="/app/profile" element={<Profile />} />
          <Route path="/app/Connection" element={<Connection />} />
          <Route path="/app/Request" element={<Request />} />
          <Route path="/app/update" element={<Updates />} />
          <Route path="/app/message/:targetuserId" element={<WhatsAppChat />} />
          <Route path="/app/chats" element={<WhatsAppChat />} />
          <Route path="/app/chats/:targetuserId" element={<WhatsAppChat />} />
        </Route>
        
        {/* Auth Routes - Standalone */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <>
      <Provider store={appStore}>
        <AppContent />
      </Provider>
    </>
  );
}

export default App;
