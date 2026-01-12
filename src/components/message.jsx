import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Phone, Video, ArrowLeft, MessageCircle, User } from "lucide-react";
import getSocket, { disconnectSocket } from "../utils/socket";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import EmojiPicker from "emoji-picker-react";
import VoiceCall from "./VoiceCall";
import VideoCall from "./VideoCall";
import IncomingCall from "./IncomingCall"; 

const Message = ({ targetuserId: propTargetUserId }) => {
  const { targetuserId: paramTargetUserId } = useParams();
  const targetuserId = propTargetUserId || paramTargetUserId; // Use prop if provided, else use params
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [groupedMessages, setGroupedMessages] = useState([]);
  const [recipientName, setRecipientName] = useState("User");
  const [photoURL, setPhotoURL] = useState("");
  const [newmessage, setNewmessage] = useState("");
  const [userStatus, setUserStatus] = useState({});
  const [onlineSince, setOnlineSince] = useState({});
  const [showEmoji, setShowEmoji] = useState(false);
  const [listening, setListening] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const user = useSelector((store) => store.user);
  const userId = user?._id;

  const bottomRef = useRef(null);

  // Fetch user data separately - ensures we get name even if no messages
  const fetchUserData = async (targetuserId) => {
    try {
      const userResponse = await axios.get(`${BASE_URL}/user/${targetuserId}`, {
        withCredentials: true,
      });
      
      if (userResponse.data) {
        const { firstName, lastName, photoUrl, isOnline, lastSeen } = userResponse.data;
        setPhotoURL(photoUrl || "");
        setRecipientName(
          `${firstName || ""} ${lastName || ""}`.trim() || "User"
        );
        
        setUserStatus((prev) => ({
          ...prev,
          [targetuserId]: { 
            isOnline: !!isOnline, 
            lastSeen: lastSeen || null 
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback: try to get from connections
      try {
        const connectionsResponse = await axios.get(`${BASE_URL}/user/connections`, {
          withCredentials: true,
        });
        const connection = connectionsResponse.data?.data?.find(
          (conn) => conn._id === targetuserId
        );
        if (connection) {
          setPhotoURL(connection.photoUrl || "");
          setRecipientName(
            `${connection.firstName || ""} ${connection.lastName || ""}`.trim() || "User"
          );
        }
      } catch (err) {
        console.error("Error fetching from connections:", err);
      }
    }
  };

  const saveMessage = async (targetuserId) => {
    try {
      // First fetch user data (this ensures name is always set)
      await fetchUserData(targetuserId);

      // Then fetch messages
      const messageSave = await axios.get(`${BASE_URL}/chat/${targetuserId}`, {
        withCredentials: true,
      });

      // Try to get user data from messages if available (may have more recent status)
      const recipientMsg = messageSave?.data?.messages?.find(
        (msg) => msg.SenderId?._id === targetuserId
      );

      if (recipientMsg?.SenderId) {
        const { firstName, lastName, photoUrl, isOnline, lastSeen } = recipientMsg.SenderId;
        // Update if not already set or update status
        if (!recipientName || recipientName === "User") {
          setPhotoURL(photoUrl || "");
          setRecipientName(
            `${firstName || ""} ${lastName || ""}`.trim() || "User"
          );
        }
        // Update status from messages if available
        setUserStatus((prev) => ({
          ...prev,
          [targetuserId]: { 
            isOnline: isOnline !== undefined ? !!isOnline : prev[targetuserId]?.isOnline, 
            lastSeen: lastSeen || prev[targetuserId]?.lastSeen || null 
          },
        }));
      }

      const chatmessage = (messageSave?.data?.messages || []).map((msg) => {
        const { SenderId, text } = msg;
        return {
          senderId: SenderId?._id,
          firstName: SenderId?.firstName,
          lastName: SenderId?.lastName,
          text,
          timestamp: msg?.createdAt,
        };
      });

      setMessages(chatmessage);
    } catch (error) {
      console.error("Error fetching messages:", error);
      // Still try to fetch user data even if messages fail
      await fetchUserData(targetuserId);
    }
  };


  useEffect(() => {
    saveMessage(targetuserId);
  }, [targetuserId]);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket(userId);

    // const doJoin = () => socket.emit("joinChat", { targetuserId });
    const doJoin = () => {
      socket.emit("joinChat", { targetuserId }, (res) => {
        if (res?.status === "joined") {
          console.log("✅ Joined chat room:", res.roomId);
        } else {
          console.error("❌ Failed to join room:", res?.message);
        }
      });
    };

    if (socket.connected) {
      doJoin();
    } else {
      socket.once("connect", doJoin);
    }

    // const handleReceive = ({ text, firstName, lastName, senderId, createdAt }) => {
    //   setMessages((messages) => {
    //     // Check if this message is from current user (optimistic update)
    //     if (senderId === userId) {
    //       // Replace temporary message with real message
    //       return messages.map(msg => 
    //         msg.tempId ? {
    //           ...msg,
    //           tempId: undefined, // Remove temp ID
    //           timestamp: createdAt || new Date()
    //         } : msg
    //       );
    //     } else {
    //       // Add new message from other user
    //       const newMessage = { text, firstName, lastName, senderId, timestamp: createdAt || new Date() };
          
    //       // Create notification for new message
    //       createNotification({
    //         type: 'message',
    //         title: `New message from ${firstName} ${lastName}`,
    //         message: text.length > 50 ? text.substring(0, 50) + '...' : text,
    //         senderId: senderId,
    //         isRead: false
    //       });
          
    //       return [...messages, newMessage];
    //     }
    //   });
    // };

    // Create notification function
    const handleReceive = ({ _id, text, firstName, lastName, senderId, createdAt }) => {
  setMessages((prev) => [
    ...prev,
    {
      _id,
      text,
      firstName,
      lastName,
      senderId,
      timestamp: createdAt || new Date(),
    },
  ]);
};

    const createNotification = async (notificationData) => {
      try {
        await axios.post(`${BASE_URL}/notifications`, notificationData, {
          withCredentials: true,
        });
      } catch (err) {
        console.error("Error creating notification:", err);
      }
    };

    const handleStatus = ({ userId, isOnline, lastSeen }) => {
      setUserStatus((prev) => ({
        ...prev,
        [userId]: { isOnline, lastSeen },
      }));
      if (isOnline) {
        setOnlineSince((prev) => ({ ...prev, [userId]: new Date().toISOString() }));
      }
    };

    // Handle incoming calls
    const handleIncomingCall = (data) => {
      console.log('📞 Incoming call received:', data);
      setIncomingCallData({
        callerName: data.fromUserName,
        callerId: data.fromUserId,
        callType: data.callType
      });
      setShowIncomingCall(true);
    };

    const handleCallAccepted = (data) => {
      console.log('📞 Call accepted:', data);
      setShowIncomingCall(false);
      // Start the call interface
      if (data.callType === 'voice') {
        setShowVoiceCall(true);
      } else if (data.callType === 'video') {
        setShowVideoCall(true);
      }
    };

    const handleCallRejected = (data) => {
      console.log('📞 Call rejected:', data);
      setShowIncomingCall(false);
    };

    const handleCallEnded = (data) => {
      console.log('📞 Call ended:', data);
      setShowIncomingCall(false);
      setShowVoiceCall(false);
      setShowVideoCall(false);
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("updateUserStatus", handleStatus);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-ended", handleCallEnded);
    
    // request latest presence for recipient on mount
    // socket.emit("joinChat", { targetuserId });
    
    // Request presence data for the target user
    const requestPresence = () => {
      if (targetuserId) {
        socket.emit("getPresence", { userId: targetuserId });
      }
    };
    
    // Request presence immediately if socket is connected
    if (socket.connected) {
      requestPresence();
    } else {
      socket.once("connect", requestPresence);
    }
    
    // Also request presence after a delay
    const presenceTimer = setTimeout(requestPresence, 1000);
    
    // Periodic presence check every 30 seconds
    const periodicPresenceCheck = setInterval(() => {
      if (targetuserId) {
        requestPresence();
      }
    }, 30000);

    return () => {
      socket.off("connect", doJoin);
      socket.off("receiveMessage", handleReceive);
      socket.off("updateUserStatus", handleStatus);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-ended", handleCallEnded);
      if (presenceTimer) clearTimeout(presenceTimer);
      if (periodicPresenceCheck) clearInterval(periodicPresenceCheck);
      // Do not disconnect globally here; component unmount shouldn't kill app-wide socket
    };
  }, [userId, targetuserId, user?.firstName]);

  // 🔁 Reconnect hone par room dobara join karne ke liye
useEffect(() => {
  if (!userId) return;

  const socket = getSocket(userId);

  const handleReconnect = () => {
    console.log("🔄 Socket reconnected, rejoining chat room");

    socket.emit("joinChat", { targetuserId }, (res) => {
      if (res?.status === "joined") {
        console.log("✅ Rejoined room after reconnect:", res.roomId);
      } else {
        console.error("❌ Failed to rejoin room:", res?.message);
      }
    });
  };

  socket.on("reconnect", handleReconnect);

  return () => {
    socket.off("reconnect", handleReconnect);
  };
}, [userId, targetuserId]);


  // Handle incoming call actions
  const handleAcceptCall = () => {
    console.log('📞 Accepting incoming call');
    const socket = getSocket(userId);
    socket.emit('call-accepted', {
      callId: incomingCallData?.callId,
      acceptedBy: userId
    });
    setShowIncomingCall(false);
    
    // Start the appropriate call interface
    if (incomingCallData?.callType === 'voice') {
      setShowVoiceCall(true);
    } else if (incomingCallData?.callType === 'video') {
      setShowVideoCall(true);
    }
  };

  const handleRejectCall = () => {
    console.log('📞 Rejecting incoming call');
    const socket = getSocket(userId);
    socket.emit('call-rejected', {
      callId: incomingCallData?.callId,
      rejectedBy: userId
    });
    setShowIncomingCall(false);
  };

  // Initiate a call
  const initiateCall = async (callType) => {
    try {
      console.log(`📞 Initiating ${callType} call to ${targetuserId}`);
      
      // Send call initiation to backend
      const response = await axios.post(`${BASE_URL}/call/initiate`, {
        toUserId: targetuserId,
        callType: callType
      }, {
        withCredentials: true
      });

      console.log('📞 Call initiated successfully:', response.data);
      
      // Start the call interface immediately
      if (callType === 'voice') {
        setShowVoiceCall(true);
      } else if (callType === 'video') {
        setShowVideoCall(true);
      }
      
    } catch (error) {
      console.error('❌ Error initiating call:', error);
      // Still show call interface for testing
      if (callType === 'voice') {
        setShowVoiceCall(true);
      } else if (callType === 'video') {
        setShowVideoCall(true);
      }
    }
  };

  // const handleSend = () => {
  //   if (!newmessage.trim()) return;
  //   const messageText = newmessage.trim();
  //   setNewmessage(""); // Clear input immediately
    
  //   const socket = getSocket(userId);
  //   socket.emit("sendMessage", {
  //     text: messageText,
  //     targetuserId,
  //     firstName: user.firstName,
  //     lastName: user.lastName,
  //   });
    
  //   // Optimistic UI update - add temporary message with unique ID
  //   const tempId = `temp-${Date.now()}-${Math.random()}`;
  //   setMessages((messages) => [
  //     ...messages,
  //     {
  //       text: messageText,
  //       firstName: user.firstName,
  //       lastName: user.lastName,
  //       senderId: userId,
  //       timestamp: new Date(),
  //       tempId: tempId, // Temporary ID to identify this message
  //     },
  //   ]);
  // };

  // Scroll neeche jaane ka effect
      const handleSend = () => {
      if (!newmessage.trim()) return;

      const messageText = newmessage.trim();
      setNewmessage("");

      const socket = getSocket(userId);

      // Temporary ID for optimistic UI
      const tempId = `temp-${Date.now()}-${Math.random()}`;

      // Optimistic UI
      setMessages((prev) => [
        ...prev,
        {
          text: messageText,
          firstName: user.firstName,
          lastName: user.lastName,
          senderId: userId,
          timestamp: new Date(),
          tempId,
        },
      ]);

      socket.emit(
        "sendMessage",
        {
          text: messageText,
          targetuserId,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        (res) => {
          if (res?.status === "sent") {
            // ✅ Confirm message
            setMessages((prev) =>
              prev.map((msg) =>
                msg.tempId === tempId
                  ? {
                      ...msg,
                      tempId: undefined,
                      timestamp: res.createdAt,
                    }
                  : msg
              )
            );
          } else {
            // ❌ Failed → rollback
            console.error("Message failed:", res?.message);

            setMessages((prev) =>
              prev.filter((msg) => msg.tempId !== tempId)
            );
          }
        }
      );
    };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Emoji click handle
  const onEmojiClick = (emojiData) => {
    setNewmessage((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  // Voice to text (SpeechRecognition)
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US"; // Hindi ke liye "hi-IN"
  }

  const startListening = () => {
    if (!recognition) return alert("Speech Recognition not supported!");
    recognition.start();
    setListening(true);

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setNewmessage(transcript);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  // Online since formatting
  const formatSince = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr} hr ago`;
    return `${Math.floor(diffHr / 24)} d ago`;
  };

  // Last seen formatting
  const formatLastSeen = (dateString) => {
    if (!dateString) return "recently";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "recently";
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHr = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHr / 24);

      if (diffMin < 1) return "just now";
      if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
      if (diffHr < 24) {
        if (diffHr === 1) return "1 hour ago";
        return `${diffHr} hours ago`;
      }
      if (diffDays === 1) {
        return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      }
      if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      }

      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return "recently";
    }
  };

  // Group messages by date
  const groupMessages = (msgs) => {
    if (!msgs || !msgs.length) return [];

    const result = [];
    let currentDate = null;

    msgs.forEach((msg, idx) => {
      const msgDate = new Date(msg.timestamp).toDateString();

      if (msgDate !== currentDate) {
        currentDate = msgDate;
        result.push({
          type: "date",
          date: msg.timestamp,
          id: `date-${idx}`,
        });
      }

      result.push({
        ...msg,
        type: "message",
        id: `msg-${idx}`,
      });
    });

    return result;
  };

  // Update grouped messages when messages change
  useEffect(() => {
    setGroupedMessages(groupMessages(messages));
  }, [messages]);

  // Handle escape key to close photo modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showPhotoModal) {
        setShowPhotoModal(false);
      }
    };

    if (showPhotoModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset'; // Restore scroll
    };
  }, [showPhotoModal]);

  return (
    <>
      {/* Incoming Call Modal */}
      {console.log('📞 IncomingCall render - isOpen:', showIncomingCall)}
      <IncomingCall
        isOpen={showIncomingCall}
        onClose={() => {
          console.log('📞 IncomingCall onClose called');
          setShowIncomingCall(false);
        }}
        callerName={incomingCallData?.callerName || 'Unknown Caller'}
        callerId={incomingCallData?.callerId}
        callType={incomingCallData?.callType || 'voice'}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />

      {/* Voice Call Modal */}
      {console.log('📞 VoiceCall render - isOpen:', showVoiceCall)}
      <VoiceCall
        isOpen={showVoiceCall}
        onClose={() => {
          console.log('📞 VoiceCall onClose called');
          setShowVoiceCall(false);
        }}
        recipientName={recipientName}
        recipientId={targetuserId}
      />

      {/* Video Call Modal */}
      {console.log('📹 VideoCall render - isOpen:', showVideoCall)}
      <VideoCall
        isOpen={showVideoCall}
        onClose={() => {
          console.log('📹 VideoCall onClose called');
          setShowVideoCall(false);
        }}
        recipientName={recipientName}
        recipientId={targetuserId}
      />

      {/* Photo Modal */}
      {showPhotoModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <div 
            className="relative max-w-2xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm text-white rounded-2xl p-3 hover:bg-black/70 transition-all duration-300 border border-white/10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Photo Container */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700/50">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={`${recipientName}'s profile`}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-16 bg-gradient-to-br from-gray-700/50 to-gray-800/50">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center mb-6 border border-gray-600/30">
                    <User className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-gray-300 text-lg">No profile photo</p>
                </div>
              )}
              
              {/* User Info */}
              <div className="p-6 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border-t border-gray-700/50">
                <h3 className="text-2xl font-bold text-white mb-3">{recipientName}</h3>
                <div className="flex items-center space-x-3">
                  {userStatus[targetuserId]?.isOnline ? (
                    <>
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                      <span className="text-green-300 font-semibold">Online now</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-300">
                        Last seen: {formatLastSeen(userStatus[targetuserId]?.lastSeen)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col w-full h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-700/50 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex-shrink-0 shadow-lg">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Back Button - Mobile Only */}
          <button
            onClick={() => navigate(-1)}
            className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div 
            className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center font-bold text-lg flex-shrink-0 cursor-pointer hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 overflow-hidden ring-2 ring-gray-600/30 hover:ring-blue-500/50"
            onClick={() => setShowPhotoModal(true)}
            title="Click to view profile photo"
          >
            {photoURL ? (
              <img
                src={photoURL}
                alt={`${recipientName}'s profile`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center rounded-2xl">
                <User className="w-6 h-6 lg:w-7 lg:h-7 text-gray-300" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-white truncate">{recipientName}</h2>
            <div className="flex items-center space-x-2">
              {(() => {
                const status = userStatus[targetuserId];
                const isOnline = status?.isOnline === true;
                
                if (isOnline) {
                  return (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0 animate-pulse shadow-lg shadow-green-400/50"></span>
                      <span className="text-xs text-green-300 font-medium truncate">
                        Online now
                      </span>
                    </>
                  );
                } else {
                  return (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                      <span className="text-xs text-gray-400 truncate">
                        {status?.lastSeen 
                          ? `Last seen ${formatLastSeen(status.lastSeen)}`
                          : "Last seen recently"
                        }
                      </span>
                    </>
                  );
                }
              })()}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Back Button - Desktop */}
          <button
            onClick={() => navigate(-1)}
            className="hidden lg:flex px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 items-center justify-center text-sm font-medium text-white backdrop-blur-sm border border-white/10 hover:border-white/20"
            title="Go Back"
          >
            ← Back
          </button>
          
          {/* Call Icons */}
          <button
            onClick={() => {
              console.log('📞 Voice call button clicked');
              initiateCall('voice');
            }}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center backdrop-blur-sm border border-white/10 hover:border-white/20 hover:shadow-lg group"
            title="Voice Call"
          >
            <Phone className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => {
              console.log('📹 Video call button clicked');
              initiateCall('video');
            }}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center backdrop-blur-sm border border-white/10 hover:border-white/20 hover:shadow-lg group"
            title="Video Call"
          >
            <Video className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-3 lg:space-y-4 bg-gradient-to-b from-slate-800/30 to-slate-900/50 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {groupedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 lg:w-32 lg:h-32 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500/20 to-blue-500/20 flex items-center justify-center border border-gray-700/50">
                <MessageCircle className="w-12 h-12 lg:w-16 lg:h-16 text-gray-400" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-400 bg-clip-text text-transparent">
                Start the conversation
              </h3>
              <p className="text-gray-400 text-base lg:text-lg leading-relaxed">
                Send a message to begin chatting with {recipientName}
              </p>
            </div>
          </div>
        ) : (
          groupedMessages.map((item) => {
            if (item.type === "date") {
              return (
                <div key={item.id} className="flex justify-center my-4 lg:my-6">
                  <div className="bg-gray-700/50 text-xs lg:text-sm text-gray-300 px-4 py-2 rounded-2xl backdrop-blur-sm border border-gray-600/30">
                    {formatDate(item.date)}
                  </div>
                </div>
              );
            }

            const msg = item;
            const isOwnMessage = user.firstName === msg.firstName;
            const isTempMessage = msg.tempId;
            return (
              <div
                key={msg.tempId || msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 lg:mb-4`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[60%] xl:max-w-[50%] rounded-2xl px-4 py-3 lg:px-5 lg:py-4 shadow-lg backdrop-blur-sm border transition-all duration-300 ${
                    isOwnMessage
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-lg border-blue-400/30 shadow-blue-500/25"
                      : "bg-gradient-to-br from-gray-700/80 to-gray-800/80 text-white rounded-bl-lg border-gray-600/30 shadow-gray-900/50"
                  } ${isTempMessage ? 'opacity-70 scale-95' : 'hover:scale-[1.02]'}`}
                >
                  {/* Name - only show for other person's messages */}
                  {!isOwnMessage && (
                    <div className="text-xs lg:text-sm font-semibold mb-2 text-blue-300">
                      {msg.firstName + " " + msg.lastName}
                    </div>
                  )}
                  {/* Message */}
                  <div className="text-sm sm:text-base lg:text-lg break-words leading-relaxed">{msg.text}</div>

                  {/* Time */}
                  <div className={`text-[10px] lg:text-xs opacity-70 mt-2 flex items-center ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isTempMessage && <span className="ml-2 animate-spin">⏳</span>}
                    {isOwnMessage && !isTempMessage && (
                      <span className="ml-2 text-blue-200">✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="relative flex items-center px-6 py-5 border-t border-gray-700/50 bg-gradient-to-r from-slate-800 to-slate-700 gap-3 flex-shrink-0 shadow-lg">
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-3 rounded-2xl bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-300 flex-shrink-0 border border-gray-600/30 hover:border-gray-500/50 backdrop-blur-sm group"
          title="Emoji"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">😀</span>
        </button>

        {showEmoji && (
          <div className="absolute bottom-24 left-6 z-10 rounded-2xl overflow-hidden shadow-2xl border border-gray-600/30">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}

        <input
          type="text"
          value={newmessage}
          onChange={(e) => setNewmessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3.5 rounded-2xl border border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-gray-700/50 text-white placeholder-gray-400 text-base min-w-0 backdrop-blur-sm transition-all duration-300 hover:bg-gray-700/70"
        />

        {newmessage.trim() ? (
          <button
            onClick={handleSend}
            className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 flex-shrink-0 shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 border border-blue-400/30"
            title="Send Message"
          >
            <Send className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={startListening}
            className={`p-3 rounded-2xl transition-all duration-300 flex-shrink-0 backdrop-blur-sm border group ${
              listening 
                ? "bg-red-500/80 hover:bg-red-600/80 border-red-400/50 shadow-lg shadow-red-500/25" 
                : "bg-gray-700/50 hover:bg-gray-600/50 border-gray-600/30 hover:border-gray-500/50"
            }`}
            title={listening ? "Stop Recording" : "Voice Message"}
          >
            <svg className={`h-5 w-5 transition-all duration-300 ${
              listening ? "text-white animate-pulse" : "text-gray-300 group-hover:text-white group-hover:scale-110"
            }`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
    </>
  );
};

export default Message;
