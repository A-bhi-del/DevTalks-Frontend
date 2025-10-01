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
import { addUser } from "./utils/userSlice";

function AppContent() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize user from localStorage on app start
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
      dispatch(addUser(user));
    }
  }, [dispatch]);

  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/" element={<Body />}>
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Feed/>}/>
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/Connection" element={<Connection />} />
          <Route path="/Request" element={<Request />} />
          <Route path="/update" element={<Updates />} />
          <Route path="/message/:targetuserId" element={<Message />} />
        </Route>
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
