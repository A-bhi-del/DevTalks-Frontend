import React from "react";
import { useNavigate } from "react-router-dom";

const FriendsSection = () => {
  const navigate = useNavigate();

  const friends = [
    { id: 1, name: "Tanu" },
    { id: 2, name: "Ravi" },
    { id: 3, name: "Simran" },
    { id: 4, name: "Aman" },
  ];

  return (
    <div
      style={{
        width: "33.33%", // 1/3 width
        backgroundColor: "rgba(0, 0, 0, 0.3)", // transparent black
        color: "white",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        height: "100vh",
        overflowY: "auto",
      }}
    >
      {/* Close Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "transparent",
          color: "white",
          border: "none",
          fontSize: "18px",
          cursor: "pointer",
        }}
      >
        ✖
      </button>

      <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>Friends</h2>

      {/* Friends List */}
      {friends.map((friend) => (
        <div
          key={friend.id}
          style={{
            padding: "8px",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
            fontSize: "14px",
          }}
        >
          {friend.name}
        </div>
      ))}
    </div>
  );
};

export default FriendsSection;
