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
import { fetchUser } from "./utils/userActions.js";

function AppContent() {
  const dispatch = useDispatch();
   useEffect(() => {
    dispatch(fetchUser());
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
