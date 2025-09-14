import React from "react";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Body from "./components/body";
import Login from "./components/Login_temp";
import Profile from "./components/Profile_temp";
import { Provider } from "react-redux";
import appStore from "./utils/appStore";
import Feed from "./components/feed";
import Signup from "./components/Signup_temp";
import Connection from "./components/connection";
import Request from "./components/Request_temp";
import Updates from "./components/Updates._tempjsx";
import Message from "./components/Message_temp";

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
