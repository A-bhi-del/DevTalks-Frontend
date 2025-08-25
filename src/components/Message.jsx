import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Send } from "lucide-react";
import createsocketConnection from "../utils/socket";
import { useSelector } from "react-redux";

const Message = () => {
  const { targetuserId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newmessage, setNewmessage] = useState("");
  const user = useSelector((store) => store.user);
  const userId = user?._id;

  useEffect(() => {
    if (!userId) {
      return;
    }
    const socket = createsocketConnection();

    socket.emit("joinchat", { userId, targetuserId });

    return () => {
      socket.disconnect();
    };
  }, [userId, targetuserId]);

  const handleSend = () => {
    const socket = createsocketConnection();
    socket.emit("sendmessage", { text: newmessage, userId, targetuserId, firstName: user.firstName })
    setNewmessage("");
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto h-[600px] border rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-zinc-900 m-10">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-blue-600 text-white">
        <h2 className="font-semibold">Chat with {targetuserId}</h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 dark:bg-zinc-800">
        {messages.length === 0 && (
          <p className="text-center text-gray-500">No messages yet...</p>
        )}
        {messages.map((msg, idx) => (
          <div key={idx}>
            <div>{msg.text}</div>
          </div>
        ))}
      </div>

      {/* Input box */}
      <div className="flex items-center p-3 border-t bg-white dark:bg-zinc-900">
        <input
          type="text"
          value={newmessage}
          onChange={(e) => setNewmessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 p-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
        />
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
