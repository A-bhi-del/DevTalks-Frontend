import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Send } from "lucide-react";
import getSocket, { disconnectSocket } from "../utils/socket";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import EmojiPicker from "emoji-picker-react"; // ✅ Emoji picker import

const Message = () => {
  const { targetuserId } = useParams();
  const [messages, setMessages] = useState([]);
  const [groupedMessages, setGroupedMessages] = useState([]);
  const [recipientName, setRecipientName] = useState("User");
  const [photoURL, setPhotoURL] = useState("");
  const [newmessage, setNewmessage] = useState("");
  const [userStatus, setUserStatus] = useState({});
  const [showEmoji, setShowEmoji] = useState(false);
  const [listening, setListening] = useState(false);
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
        const { firstName, lastName, photoUrl } = recipientMsg.SenderId;
        setPhotoURL(photoUrl);
        setRecipientName(
          `${firstName || ""} ${lastName || ""}`.trim() || "User"
        );
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
      setMessages((messages) => [
        ...messages,
        { text, firstName, lastName, senderId, timestamp: createdAt || new Date() },
      ]);
    };

    const handleStatus = ({ userId, isOnline, lastSeen }) => {
      setUserStatus((prev) => ({
        ...prev,
        [userId]: { isOnline, lastSeen },
      }));
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("updateUserStatus", handleStatus);

    return () => {
      socket.off("connect", doJoin);
      socket.off("receiveMessage", handleReceive);
      socket.off("updateUserStatus", handleStatus);
      // Do not disconnect globally here; component unmount shouldn't kill app-wide socket
    };
  }, [userId, targetuserId, user?.firstName]);

  const handleSend = () => {
    if (!newmessage.trim()) return;
    const socket = getSocket(userId);
    socket.emit("sendMessage", {
      text: newmessage,
      targetuserId,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    // Optimistic UI update
    setMessages((messages) => [
      ...messages,
      {
        text: newmessage,
        firstName: user.firstName,
        lastName: user.lastName,
        senderId: userId,
        timestamp: new Date(),
      },
    ]);
    setNewmessage("");
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

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto h-[600px] border rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-zinc-900 m-10">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-blue-600 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-lg">
            {photoURL ? (
              <img
                src={photoURL}
                alt={`${recipientName}'s profile`}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-xl font-bold">
                {recipientName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{recipientName}</h2>
            <div className="flex items-center space-x-1">
              {userStatus[targetuserId]?.isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  <span className="text-xs opacity-80">Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  <span className="text-xs opacity-80">
                    Last seen:{" "}
                    {userStatus[targetuserId]?.lastSeen
                      ? new Date(
                          userStatus[targetuserId].lastSeen
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Offline"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 dark:bg-zinc-800">
        {groupedMessages.length === 0 ? (
          <p className="text-center text-gray-500">No messages yet...</p>
        ) : (
          groupedMessages.map((item) => {
            if (item.type === "date") {
              return (
                <div key={item.id} className="flex justify-center my-2">
                  <div className="bg-gray-200 dark:bg-zinc-700 text-xs text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                    {formatDate(item.date)}
                  </div>
                </div>
              );
            }

            const msg = item;
            return (
              <div
                key={msg.id}
                className={
                  "chat " +
                  (user.firstName === msg.firstName ? "chat-end" : "chat-start")
                }
              >
                <div
                  className={
                    "chat-bubble " +
                    (user.firstName === msg.firstName
                      ? "bg-gray-500 text-white"
                      : "bg-blue-400 text-white")
                  }
                >
                  {/* Naam */}
                  <div className="text-sm font-semibold mb-1">
                    {msg.firstName + " " + msg.lastName}
                  </div>
                  {/* Message */}
                  <div className="text-base break-words">{msg.text}</div>

                  {/* Time */}
                  <div className="text-[10px] opacity-70 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {/* Scroll ke liye dummy div */}
        <div ref={bottomRef} />
      </div>

      {/* Input box */}
      <div className="relative flex items-center p-3 border-t bg-white dark:bg-zinc-900">
        {/* ✅ Emoji Button */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="mr-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700"
        >
          😀
        </button>

        {showEmoji && (
          <div className="absolute bottom-14 left-4 z-10">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}

        <input
          type="text"
          value={newmessage}
          onChange={(e) => setNewmessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 p-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
        />

        {/* ✅ Mic Button */}
        <button
          onClick={startListening}
          className={`ml-2 p-2 rounded-full ${
            listening ? "bg-red-500" : "bg-green-500"
          } text-white`}
        >
          🎤
        </button>

        <button
          onClick={handleSend}
          className="ml-2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Message;
