import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Phone, Video, ArrowLeft } from "lucide-react";
import getSocket, { disconnectSocket } from "../utils/socket";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import EmojiPicker from "emoji-picker-react"; 

const Message = () => {
  const { targetuserId } = useParams();
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
  const user = useSelector((store) => store.user);
  const userId = user?._id;

  const bottomRef = useRef(null);

  const saveMessage = async (targetuserId) => {
    try {
      const messageSave = await axios.get(`${BASE_URL}/chat/${targetuserId}`, {
        withCredentials: true,
      });

      const recipientMsg = messageSave?.data?.messages.find(
        (msg) => msg.SenderId?._id === targetuserId
      );

      if (recipientMsg?.SenderId) {
        const { firstName, lastName, photoUrl, isOnline, lastSeen } = recipientMsg.SenderId;
        setPhotoURL(photoUrl);
        setRecipientName(
          `${firstName || ""} ${lastName || ""}`.trim() || "User"
        );
        // seed initial presence if available from populated SenderId
        setUserStatus((prev) => ({
          ...prev,
          [targetuserId]: { isOnline: !!isOnline, lastSeen: lastSeen || null },
        }));
      }

      const chatmessage = messageSave?.data?.messages.map((msg) => {
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
    }
  };

  useEffect(() => {
    saveMessage(targetuserId);
  }, [targetuserId]);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket(userId);

    const doJoin = () => socket.emit("joinChat", { targetuserId });
    if (socket.connected) {
      doJoin();
    } else {
      socket.once("connect", doJoin);
    }

    const handleReceive = ({ text, firstName, lastName, senderId, createdAt }) => {
      setMessages((messages) => {
        // Check if this message is from current user (optimistic update)
        if (senderId === userId) {
          // Replace temporary message with real message
          return messages.map(msg => 
            msg.tempId ? {
              ...msg,
              tempId: undefined, // Remove temp ID
              timestamp: createdAt || new Date()
            } : msg
          );
        } else {
          // Add new message from other user
          const newMessage = { text, firstName, lastName, senderId, timestamp: createdAt || new Date() };
          
          // Create notification for new message
          createNotification({
            type: 'message',
            title: `New message from ${firstName} ${lastName}`,
            message: text.length > 50 ? text.substring(0, 50) + '...' : text,
            senderId: senderId,
            isRead: false
          });
          
          return [...messages, newMessage];
        }
      });
    };

    // Create notification function
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

    socket.on("receiveMessage", handleReceive);
    socket.on("updateUserStatus", handleStatus);
    // request latest presence for recipient on mount
    socket.emit("joinChat", { targetuserId });

    return () => {
      socket.off("connect", doJoin);
      socket.off("receiveMessage", handleReceive);
      socket.off("updateUserStatus", handleStatus);
      // Do not disconnect globally here; component unmount shouldn't kill app-wide socket
    };
  }, [userId, targetuserId, user?.firstName]);

  const handleSend = () => {
    if (!newmessage.trim()) return;
    const messageText = newmessage.trim();
    setNewmessage(""); // Clear input immediately
    
    const socket = getSocket(userId);
    socket.emit("sendMessage", {
      text: messageText,
      targetuserId,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    
    // Optimistic UI update - add temporary message with unique ID
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    setMessages((messages) => [
      ...messages,
      {
        text: messageText,
        firstName: user.firstName,
        lastName: user.lastName,
        senderId: userId,
        timestamp: new Date(),
        tempId: tempId, // Temporary ID to identify this message
      },
    ]);
  };

  // Scroll neeche jaane ka effect
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
    if (!dateString) return "Offline";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
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
      {/* Photo Modal */}
      {showPhotoModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <div 
            className="relative max-w-2xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Photo Container */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={`${recipientName}'s profile`}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-16 bg-gray-100">
                  <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold mb-4">
                    {recipientName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <p className="text-gray-600 text-lg">No profile photo</p>
                </div>
              )}
              
              {/* User Info */}
              <div className="p-6 bg-gray-50">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{recipientName}</h3>
                <div className="flex items-center space-x-2">
                  {userStatus[targetuserId]?.isOnline ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-medium">Online</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-600">
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

      <div className="flex flex-col w-full h-screen lg:h-[calc(100vh-2rem)] lg:max-w-6xl lg:mx-auto lg:border lg:rounded-2xl lg:shadow-lg overflow-hidden bg-white dark:bg-zinc-900 lg:m-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white flex-shrink-0">
        <div className="flex items-center space-x-3 lg:space-x-4 flex-1 min-w-0">
          {/* Back Button - Mobile Only */}
          <button
            onClick={() => navigate(-1)}
            className="lg:hidden p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200 flex items-center justify-center"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all duration-200"
            onClick={() => setShowPhotoModal(true)}
            title="Click to view profile photo"
          >
            {photoURL ? (
              <img
                src={photoURL}
                alt={`${recipientName}'s profile`}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-xl lg:text-2xl font-bold">
                {recipientName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base sm:text-lg lg:text-xl truncate">{recipientName}</h2>
            <div className="flex items-center space-x-1">
              {userStatus[targetuserId]?.isOnline ? (
                <>
                  <span className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-green-400 flex-shrink-0"></span>
                  <span className="text-xs lg:text-sm opacity-80 truncate">
                    Online{onlineSince[targetuserId] ? ` • since ${formatSince(onlineSince[targetuserId])}` : ""}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-gray-400 flex-shrink-0"></span>
                  <span className="text-xs lg:text-sm opacity-80 truncate">Last seen: {formatLastSeen(userStatus[targetuserId]?.lastSeen)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Call Icons */}
        <div className="flex items-center space-x-2 lg:space-x-3 ml-3">
          <button
            onClick={() => {
              // TODO: Implement voice call functionality
              console.log("Voice call to", recipientName);
            }}
            className="p-2 lg:p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200 flex items-center justify-center"
            title="Voice Call"
          >
            <Phone className="h-5 w-5 lg:h-6 lg:w-6" />
          </button>
          <button
            onClick={() => {
              // TODO: Implement video call functionality
              console.log("Video call to", recipientName);
            }}
            className="p-2 lg:p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200 flex items-center justify-center"
            title="Video Call"
          >
            <Video className="h-5 w-5 lg:h-6 lg:w-6" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-2 sm:p-4 lg:p-6 overflow-y-auto space-y-2 sm:space-y-3 lg:space-y-4 bg-gray-50 dark:bg-zinc-800">
        {groupedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl lg:text-8xl mb-4">💬</div>
              <p className="text-gray-500 text-sm sm:text-base lg:text-lg">No messages yet...</p>
              <p className="text-gray-400 text-xs sm:text-sm lg:text-base mt-2">Start a conversation!</p>
            </div>
          </div>
        ) : (
          groupedMessages.map((item) => {
            if (item.type === "date") {
              return (
                <div key={item.id} className="flex justify-center my-3 lg:my-4">
                  <div className="bg-gray-200 dark:bg-zinc-700 text-xs lg:text-sm text-gray-600 dark:text-gray-300 px-4 py-2 rounded-full">
                    {formatDate(item.date)}
                  </div>
                </div>
              );
            }

            const msg = item;
            const isOwnMessage = user.firstName === msg.firstName;
            const isTempMessage = msg.tempId; // Check if it's a temporary message
            return (
              <div
                key={msg.tempId || msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 lg:mb-3`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[60%] xl:max-w-[50%] rounded-2xl px-3 py-2 lg:px-4 lg:py-3 ${
                    isOwnMessage
                      ? "bg-blue-500 text-white rounded-br-md"
                      : "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-zinc-600"
                  } ${isTempMessage ? 'opacity-70' : ''}`}
                >
                  {/* Naam - only show for other person's messages */}
                  {!isOwnMessage && (
                    <div className="text-xs lg:text-sm font-semibold mb-1 opacity-80">
                      {msg.firstName + " " + msg.lastName}
                    </div>
                  )}
                  {/* Message */}
                  <div className="text-sm sm:text-base lg:text-lg break-words leading-relaxed">{msg.text}</div>

                  {/* Time */}
                  <div className={`text-[10px] lg:text-xs opacity-70 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {isTempMessage && <span className="ml-1">⏳</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="relative flex items-center p-2 sm:p-3 lg:p-4 border-t bg-white dark:bg-zinc-900 gap-2 sm:gap-3 flex-shrink-0">
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-2 sm:p-2.5 lg:p-3 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 transition-colors duration-200 flex-shrink-0"
          title="Emoji"
        >
          <span className="text-sm sm:text-base lg:text-lg">😀</span>
        </button>

        {showEmoji && (
          <div className="absolute bottom-14 sm:bottom-16 lg:bottom-20 left-2 sm:left-4 lg:left-6 z-10">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}

        <input
          type="text"
          value={newmessage}
          onChange={(e) => setNewmessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 p-3 sm:p-4 lg:p-5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white text-sm sm:text-base lg:text-lg min-w-0"
        />

        <button
          onClick={startListening}
          className={`p-2 sm:p-2.5 lg:p-3 rounded-full ${
            listening ? "bg-red-500" : "bg-green-500"
          } text-white transition-colors duration-200 flex-shrink-0`}
          title={listening ? "Stop Recording" : "Voice Message"}
        >
          <span className="text-sm sm:text-base lg:text-lg">🎤</span>
        </button>

        <button
          onClick={handleSend}
          className="p-2 sm:p-2.5 lg:p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 flex-shrink-0"
          title="Send Message"
        >
          <Send className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
        </button>
      </div>
    </div>
    </>
  );
};

export default Message;
