import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { removeUser } from "../utils/userSlice";
import axios from "axios";

const Navbar = () => {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const nevigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post(BASE_URL + "/logout", {}, { withCredentials: true });
      dispatch(removeUser(null));
      nevigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/notifications`, {
        withCredentials: true,
      });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`${BASE_URL}/notifications/${notificationId}/read`, {}, {
        withCredentials: true,
      });
      fetchNotifications(); // Refresh notifications
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await axios.patch(`${BASE_URL}/notifications/mark-all-read`, {}, {
        withCredentials: true,
      });
      fetchNotifications(); // Refresh notifications
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
          >
            <li>
              <Link to="/Connection">Friends</Link>
            </li>
            <li>
              <Link to="/Request">Requests</Link>
            </li>
            <li>
              <Link to="/update">Updates</Link>
            </li>
            {/* <li><a>About</a></li> */}
          </ul>
        </div>
      </div>

      <div className="navbar-center">
        <Link className="btn btn-ghost text-xl" to={user ? "/" : "/login"}>
          Dev.Talks
        </Link>
      </div>


        <div className="navbar-end gap-2">
          {/* Notifications Dropdown */}
          <div className="dropdown dropdown-end">
            <button 
              className="btn btn-ghost btn-circle" 
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <div className="indicator">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="badge badge-xs badge-primary indicator-item">
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>
            {showNotifications && (
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-80 max-h-96 overflow-y-auto"
              >
                <li className="menu-title">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      className="btn btn-xs btn-primary"
                      onClick={markAllAsRead}
                    >
                      Mark All Read
                    </button>
                  )}
                </li>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <li key={notification._id}>
                      <div 
                        className={`flex flex-col p-2 cursor-pointer hover:bg-gray-100 ${
                          !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => {
                          markAsRead(notification._id);
                          if (notification.type === 'message') {
                            nevigate(`/message/${notification.senderId}`);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">
                            {notification.title}
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </li>
                  ))
                ) : (
                  <li>
                    <div className="p-4 text-center text-gray-500">
                      No notifications yet
                    </div>
                  </li>
                )}
              </ul>
            )}
          </div>

        {/* Profile Avatar Dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            {user && (
              <div className="w-10 rounded-full">
                <img src={user.photoUrl} alt="User Avatar" />
              </div>
            )}
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <Link to="/profile">Profile</Link>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <Link onClick={handleLogout}>Logout</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
