import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useNavigate, useParams } from "react-router-dom";
import Message from "./message";
import { Search, Menu, Users, MessageCircle, Settings, MoreVertical, Plus, User } from "lucide-react";

const WhatsAppChat = () => {
  const { targetuserId } = useParams(); // Get targetuserId from URL if present
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatList, setChatList] = useState([]); // Store last messages for each chat
  const [activeView, setActiveView] = useState('chats'); // 'chats' or 'friends'
  const user = useSelector((store) => store.user);
  
  // Function to handle chat selection with URL update
  const handleChatSelect = (userId) => {
    setSelectedChat(userId);
    navigate(`/app/chats/${userId}`, { replace: true });
  };

  // Fetch connections
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await axios.get(BASE_URL + "/user/connections", {
          withCredentials: true,
        });
        setConnections(response.data.data || []);
        
        // If targetuserId is in URL, use it; otherwise select first connection
        if (targetuserId) {
          setSelectedChat(targetuserId);
        } else if (response.data.data && response.data.data.length > 0 && !selectedChat) {
          setSelectedChat(response.data.data[0]._id);
        }
      } catch (err) {
        console.error("Error fetching connections:", err);
      }
    };

    const localUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (localUser || user) {
      fetchConnections();
    }
  }, [targetuserId]); // Add targetuserId as dependency

  // Fetch last message for each connection
  useEffect(() => {
    const fetchLastMessages = async () => {
      const messagesPromises = connections.map(async (connection) => {
        try {
          const response = await axios.get(`${BASE_URL}/chat/${connection._id}`, {
            withCredentials: true,
          });
          
          const messages = response.data?.messages || [];
          const lastMessage = messages[messages.length - 1];
          
          return {
            userId: connection._id,
            lastMessage: lastMessage?.text || "",
            lastMessageTime: lastMessage?.createdAt || null,
            unreadCount: 0, // You can implement unread count logic here
          };
        } catch (err) {
          console.error(`Error fetching messages for ${connection._id}:`, err);
          return {
            userId: connection._id,
            lastMessage: "",
            lastMessageTime: null,
            unreadCount: 0,
          };
        }
      });

      const lastMessages = await Promise.all(messagesPromises);
      setChatList(lastMessages);
    };

    if (connections.length > 0) {
      fetchLastMessages();
    }
  }, [connections]);

  // Filter connections based on search
  const filteredConnections = connections.filter((conn) => {
    const fullName = `${conn.firstName} ${conn.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Get last message for a connection
  const getLastMessage = (userId) => {
    const chat = chatList.find((c) => c.userId === userId);
    return chat?.lastMessage || "No messages yet";
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHr < 24) return `${diffHr}h`;
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Get last message time
  const getLastMessageTime = (userId) => {
    const chat = chatList.find((c) => c.userId === userId);
    return formatTime(chat?.lastMessageTime);
  };

  if (!connections || connections.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-blue-500/20 to-blue-500/20 flex items-center justify-center border border-gray-700/50">
            <Users className="w-16 h-16 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-400 bg-clip-text text-transparent">
            No Connections Yet
          </h3>
          <p className="text-gray-400 text-lg leading-relaxed mb-6">
            Start connecting with people to begin chatting!
          </p>
          <button
            onClick={() => navigate('/app')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
          >
            Find People
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Left Sidebar - Navigation */}
      <div className="hidden lg:flex flex-col w-20 border-r border-gray-700/50 bg-gradient-to-b from-slate-800 to-slate-900 items-center py-6 shadow-xl">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
        </div>
        
        {/* Navigation Icons */}
        <div className="flex flex-col space-y-4 mb-auto">
          {/* Chats Icon */}
          <button
            onClick={() => setActiveView('chats')}
            className={`group relative p-4 rounded-2xl transition-all duration-300 ${
              activeView === 'chats' 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25' 
                : 'hover:bg-gray-700/50 hover:shadow-lg'
            }`}
            title="Chats"
          >
            <MessageCircle className={`w-6 h-6 transition-colors ${
              activeView === 'chats' ? 'text-white' : 'text-gray-400 group-hover:text-white'
            }`} />
            {activeView === 'chats' && (
              <div className="absolute -right-1 -top-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </button>

          {/* Friends Icon */}
          <button
            onClick={() => setActiveView('friends')}
            className={`group relative p-4 rounded-2xl transition-all duration-300 ${
              activeView === 'friends' 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25' 
                : 'hover:bg-gray-700/50 hover:shadow-lg'
            }`}
            title="Friends"
          >
            <Users className={`w-6 h-6 transition-colors ${
              activeView === 'friends' ? 'text-white' : 'text-gray-400 group-hover:text-white'
            }`} />
          </button>

          {/* Settings Icon */}
          <button
            className="group p-4 rounded-2xl hover:bg-gray-700/50 hover:shadow-lg transition-all duration-300"
            title="Settings"
          >
            <Settings className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Profile Icon */}
        <div className="mt-auto">
          <div className="relative group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-gray-300" strokeWidth={1.5} />
              )}
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
          </div>
        </div>
      </div>

      {/* Left Panel - Chat List / Friends List */}
      <div className="w-full md:w-1/3 lg:w-96 flex flex-col border-r border-gray-700/50 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 flex items-center justify-between border-b border-gray-700/50 shadow-lg">
          <div className="flex items-center space-x-4">
            <button className="lg:hidden p-2.5 rounded-xl hover:bg-gray-700/50 transition-colors">
              <Menu className="w-5 h-5 text-gray-300" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white">
                {activeView === 'chats' ? 'Messages' : 'Friends'}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {activeView === 'chats' ? `${connections.length} conversations` : `${connections.length} friends`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {activeView === 'chats' && (
              <>
                <button className="p-2.5 rounded-xl hover:bg-gray-700/50 transition-colors group">
                  <Plus className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>
                <button className="p-2.5 rounded-xl hover:bg-gray-700/50 transition-colors group">
                  <MoreVertical className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs for Chats and Friends */}
        <div className="flex border-b border-gray-700/50 bg-slate-800/50">
          <button
            onClick={() => setActiveView('chats')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 relative ${
              activeView === 'chats'
                ? 'text-white bg-gradient-to-r from-blue-500/20 to-blue-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            Messages
            {activeView === 'chats' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveView('friends')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 relative ${
              activeView === 'friends'
                ? 'text-white bg-gradient-to-r from-blue-500/20 to-pink-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            Friends
            {activeView === 'friends' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-pink-500"></div>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 bg-slate-800/30">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={activeView === 'chats' ? "Search conversations..." : "Search friends..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700/50 text-white placeholder-gray-400 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-700/70 transition-all duration-300 border border-gray-600/30"
            />
          </div>
        </div>

        {/* Chat List or Friends List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {activeView === 'friends' ? (
            // Friends List View
            <div className="space-y-1 p-2">
              {filteredConnections.map((connection) => {
                return (
                  <div
                    key={connection._id}
                    onClick={() => {
                      handleChatSelect(connection._id);
                      setActiveView('chats');
                    }}
                    className="group px-4 py-4 cursor-pointer hover:bg-gradient-to-r hover:from-gray-700/30 hover:to-gray-600/20 transition-all duration-300 rounded-2xl mx-2 border border-transparent hover:border-gray-600/30 relative overflow-hidden"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Profile Picture */}
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-600 to-gray-700 ring-2 ring-gray-600/30 group-hover:ring-blue-500/30 transition-all duration-300">
                          {connection.photoUrl && connection.photoUrl !== "https://via.placeholder.com/56" ? (
                            <img
                              src={connection.photoUrl}
                              alt={connection.firstName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                              <User className="w-7 h-7 text-gray-300" strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-800 shadow-lg shadow-green-500/50"></div>
                      </div>

                      {/* Friend Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate text-lg group-hover:text-blue-300 transition-colors">
                          {connection.firstName} {connection.lastName}
                        </h3>
                        <p className="text-sm text-gray-400 truncate mt-1">
                          {connection.about || "Available for chat"}
                        </p>
                      </div>

                      {/* Message Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChatSelect(connection._id);
                          setActiveView('chats');
                        }}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm rounded-xl transition-all duration-300 flex-shrink-0 shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 flex items-center space-x-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Chat</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Chat List View
            <div className="space-y-1 p-2">
              {filteredConnections.map((connection) => {
                const isSelected = selectedChat === connection._id;
                const lastMsg = getLastMessage(connection._id);
                const lastMsgTime = getLastMessageTime(connection._id);

                return (
                  <div
                    key={connection._id}
                    onClick={() => handleChatSelect(connection._id)}
                    className={`group px-4 py-4 cursor-pointer transition-all duration-300 rounded-2xl mx-2 border relative overflow-hidden ${
                      isSelected 
                        ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-500/30 shadow-lg shadow-blue-500/10" 
                        : "hover:bg-gradient-to-r hover:from-gray-700/30 hover:to-gray-600/20 border-transparent hover:border-gray-600/30"
                    }`}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full"></div>
                    )}
                    
                    <div className="flex items-center space-x-4">
                      {/* Profile Picture */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-600 to-gray-700 ring-2 transition-all duration-300 ${
                          isSelected ? "ring-blue-500/50" : "ring-gray-600/30 group-hover:ring-blue-500/30"
                        }`}>
                          {connection.photoUrl && connection.photoUrl !== "https://via.placeholder.com/56" ? (
                            <img
                              src={connection.photoUrl}
                              alt={connection.firstName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                              <User className="w-7 h-7 text-gray-300" strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-800 shadow-lg shadow-green-500/50"></div>
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`font-semibold truncate text-lg transition-colors ${
                            isSelected ? "text-blue-300" : "text-white group-hover:text-blue-300"
                          }`}>
                            {connection.firstName} {connection.lastName}
                          </h3>
                          {lastMsgTime && (
                            <span className={`text-xs ml-2 flex-shrink-0 px-2 py-1 rounded-lg transition-colors ${
                              isSelected 
                                ? "text-blue-200 bg-blue-500/20" 
                                : "text-gray-400 bg-gray-700/50"
                            }`}>
                              {lastMsgTime}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-400 truncate leading-relaxed">
                            {lastMsg.length > 45 ? lastMsg.substring(0, 45) + "..." : lastMsg || "Start a conversation"}
                          </p>
                          {/* Unread count badge */}
                          {/* {unreadCount > 0 && (
                            <span className="bg-gradient-to-r from-blue-500 to-blue-500 text-white text-xs rounded-full px-2.5 py-1 ml-2 font-semibold shadow-lg animate-pulse">
                              {unreadCount}
                            </span>
                          )} */}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Active Chat */}
      <div className="hidden md:flex flex-1 flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
        {selectedChat ? (
          <MessageWrapper targetuserId={selectedChat} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-white">
            <div className="text-center max-w-md">
              <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-blue-500/20 to-blue-500/20 flex items-center justify-center border border-gray-700/50">
                <MessageCircle className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-400 bg-clip-text text-transparent">
                Welcome to DevTalks
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                Select a conversation to start messaging with your connections
              </p>
              <div className="mt-8 p-4 bg-gray-800/50 rounded-2xl border border-gray-700/30">
                <p className="text-sm text-gray-500">
                  💡 Tip: Use the search bar to quickly find conversations
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile View - Show only chat list or active chat */}
      <div className="md:hidden flex-1 flex flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
        {selectedChat ? (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 border-b border-gray-700/50 flex-shrink-0 shadow-lg">
              <button
                onClick={() => {
                  setSelectedChat(null);
                  navigate('/app/chats', { replace: true });
                }}
                className="text-white hover:text-blue-300 flex items-center space-x-3 transition-colors"
              >
                <div className="p-2 rounded-xl hover:bg-gray-700/50 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
                <span className="font-medium">Back to Chats</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MessageWrapper targetuserId={selectedChat} />
            </div>
          </>
        ) : (
          <>
            {/* Chat List Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between border-b border-gray-700/50 flex-shrink-0 shadow-lg">
              <div className="flex items-center space-x-4">
                <button className="p-2.5 rounded-xl hover:bg-gray-700/50 transition-colors">
                  <Menu className="w-5 h-5 text-gray-300" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {activeView === 'chats' ? 'Messages' : 'Friends'}
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {activeView === 'chats' ? `${connections.length} conversations` : `${connections.length} friends`}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs for Chats and Friends - Mobile */}
            <div className="flex border-b border-gray-700/50 bg-slate-800/50">
              <button
                onClick={() => setActiveView('chats')}
                className={`flex-1 px-4 py-4 text-sm font-semibold transition-all duration-300 relative ${
                  activeView === 'chats'
                    ? 'text-white bg-gradient-to-r from-blue-500/20 to-blue-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                }`}
              >
                Messages
                {activeView === 'chats' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-500"></div>
                )}
              </button>
              <button
                onClick={() => setActiveView('friends')}
                className={`flex-1 px-4 py-4 text-sm font-semibold transition-all duration-300 relative ${
                  activeView === 'friends'
                    ? 'text-white bg-gradient-to-r from-blue-500/20 to-pink-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                }`}
              >
                Friends
                {activeView === 'friends' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-pink-500"></div>
                )}
              </button>
            </div>
            
            {/* Search Bar - Mobile */}
            <div className="px-4 py-4 bg-slate-800/30 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeView === 'chats' ? "Search conversations..." : "Search friends..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-700/50 text-white placeholder-gray-400 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-700/70 transition-all duration-300 border border-gray-600/30"
                />
              </div>
            </div>

            {/* Chat List or Friends List - Mobile */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {activeView === 'friends' ? (
                // Friends List View - Mobile
                <div className="space-y-1 p-2">
                  {filteredConnections.map((connection) => {
                    return (
                      <div
                        key={connection._id}
                        onClick={() => {
                          handleChatSelect(connection._id);
                          setActiveView('chats');
                        }}
                        className="group px-4 py-4 cursor-pointer hover:bg-gradient-to-r hover:from-gray-700/30 hover:to-gray-600/20 transition-all duration-300 rounded-2xl mx-2 border border-transparent hover:border-gray-600/30"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-600 to-gray-700">
                            {connection.photoUrl && connection.photoUrl !== "https://via.placeholder.com/48" ? (
                              <img
                                src={connection.photoUrl}
                                alt={connection.firstName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                                <User className="w-6 h-6 text-gray-300" strokeWidth={1.5} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold truncate group-hover:text-blue-300 transition-colors">
                              {connection.firstName} {connection.lastName}
                            </h3>
                            <p className="text-sm text-gray-400 truncate">
                              {connection.about || "Available for chat"}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChatSelect(connection._id);
                              setActiveView('chats');
                            }}
                            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm rounded-xl transition-all duration-300 flex-shrink-0 shadow-lg"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Chat List View - Mobile
                <div className="space-y-1 p-2">
                  {filteredConnections.map((connection) => {
                    const lastMsg = getLastMessage(connection._id);
                    const lastMsgTime = getLastMessageTime(connection._id);

                    return (
                      <div
                        key={connection._id}
                        onClick={() => handleChatSelect(connection._id)}
                        className="group px-4 py-4 cursor-pointer hover:bg-gradient-to-r hover:from-gray-700/30 hover:to-gray-600/20 transition-all duration-300 rounded-2xl mx-2 border border-transparent hover:border-gray-600/30"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-600 to-gray-700">
                            {connection.photoUrl && connection.photoUrl !== "https://via.placeholder.com/48" ? (
                              <img
                                src={connection.photoUrl}
                                alt={connection.firstName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                                <User className="w-6 h-6 text-gray-300" strokeWidth={1.5} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-white font-semibold truncate group-hover:text-blue-300 transition-colors">
                                {connection.firstName} {connection.lastName}
                              </h3>
                              {lastMsgTime && (
                                <span className="text-xs text-gray-400 ml-2 flex-shrink-0 bg-gray-700/50 px-2 py-1 rounded-lg">
                                  {lastMsgTime}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 truncate">
                              {lastMsg.length > 40 ? lastMsg.substring(0, 40) + "..." : lastMsg || "Start a conversation"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Wrapper component to handle Message component with proper styling
const MessageWrapper = ({ targetuserId }) => {
  return (
    <div className="h-full flex flex-col">
      <Message key={targetuserId} targetuserId={targetuserId} />
    </div>
  );
};

export default WhatsAppChat;

