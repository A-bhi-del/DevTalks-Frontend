import React from "react";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Body from "./components/body";
import Login from "./components/Login";
import Profile from "./components/Profile";
import { Provider } from "react-redux";
import appStore from "./utils/appStore";
import Feed from "./components/Feed";
import Signup from "./components/Signup";
import Connection from "./components/connection";
import Request from "./components/Request";
import Updates from "./components/Updates";
import Message from "./components/Message";

function App() {
  return (
    <>
      <Provider store={appStore}>
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
      </Provider>
    </>
  );
}

export default App;
