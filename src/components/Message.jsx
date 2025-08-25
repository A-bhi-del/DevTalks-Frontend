import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Send } from "lucide-react";
import createsocketConnection from "../utils/socket";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import EmojiPicker from "emoji-picker-react"; // ✅ Emoji picker import

const Message = () => {
  const { targetuserId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newmessage, setNewmessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false); // ✅ emoji toggle state
  const [listening, setListening] = useState(false); // ✅ mic state
  const user = useSelector((store) => store.user);
  const userId = user?._id;

  // ✅ Auto scroll ke liye ref
  const bottomRef = useRef(null);

  const saveMessage = async (targetuserId) => {
    const messageSave = await axios.get(`${BASE_URL}/chat/${targetuserId}`, {
      withCredentials: true,
    });

    const chatmessage = messageSave?.data?.messages.map((msg) => {
      const { SenderId, text } = msg;
      return {
        firstName: SenderId?.firstName,
        lastName: SenderId?.lastName,
        text,
        timestamp: msg?.createdAt,
      };
    });

    setMessages(chatmessage);
  };

  useEffect(() => {
    saveMessage(targetuserId);
  }, [targetuserId]);

  useEffect(() => {
    if (!userId) return;
    const socket = createsocketConnection();

    socket.emit("joinchat", {
      firstName: user.firstName,
      userId,
      targetuserId,
    });

    socket.on("receivemessage", ({ text, firstName, lastName }) => {
      setMessages((messages) => [
        ...messages,
        { text, firstName, lastName, timestamp: new Date() },
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, targetuserId]);

  const handleSend = () => {
    const socket = createsocketConnection();
    socket.emit("sendmessage", {
      text: newmessage,
      userId,
      targetuserId,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    setNewmessage("");
  };

  // ✅ Scroll neeche jaane ka effect
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Emoji click handle
  const onEmojiClick = (emojiData) => {
    setNewmessage((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  // ✅ Voice to text (SpeechRecognition)
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

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto h-[600px] border rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-zinc-900 m-10">
      {/* Header */}
      <div className="flex items-center justify-center p-3 border-b bg-blue-600 text-white text-4xl">
        <h2 className="font-semibold ">Chat </h2>
        <span className="bg-green-400 rounded-3xl"></span>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 dark:bg-zinc-800">
        {messages.length === 0 && (
          <p className="text-center text-gray-500">No messages yet...</p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
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
              <div className="text-base">{msg.text}</div>

              {/* Time */}
              <div className="text-[10px] opacity-70 mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        {/* ✅ Scroll ke liye dummy div */}
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
