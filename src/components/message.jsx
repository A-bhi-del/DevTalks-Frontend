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
  const { groupId } = useParams();   // ✅ group route support
  const isGroup = !!groupId;
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState("");
  const [reactionMsg, setReactionMsg] = useState(null);
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const audioRefs = useRef({});
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recordTime, setRecordTime] = useState(0);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);



  const user = useSelector((store) => store.user);
  const userId = user?._id;

  const bottomRef = useRef(null);
  
  const downloadFile = async (url, fileName = "file.pdf") => {
    const res = await fetch(url);
    const blob = await res.blob();

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  
  const handleMediaSelect = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    setIsUploadingMedia(true);

    // ✅ Upload to backend (Cloudinary)
    const formData = new FormData();
    formData.append("media", file);

    const res = await axios.post(`${BASE_URL}/upload-media`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });

    const {
      mediaUrl,
      mediaType,
      fileName,
      fileSize,
      mediaPublicId,
    } = res.data;

    // ✅ optimistic UI
    const tempId = `temp-media-${Date.now()}-${Math.random()}`;

    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        tempId,
        senderId: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        timestamp: new Date(),

        messageType: "media",
        mediaUrl,
        mediaType,
        fileName,
        fileSize,
        mediaPublicId,
        status: "sent",
      },
    ]);

    const socket = getSocket(userId);

    // ✅ send via socket
    socket.emit(
 isGroup ? "sendGroupMessage" : "sendMessage",
  isGroup
    ? {
        groupId,
        messageType: "media",
        mediaUrl,
        mediaType,
        fileName,
        fileSize,
        mediaPublicId,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    : {
        targetuserId,
        messageType: "media",
        mediaUrl,
        mediaType,
        fileName,
        fileSize,
        mediaPublicId,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      (ack) => {
        if (ack?.status === "sent") {
          setMessages((prev) =>
            prev.map((m) =>
              m.tempId === tempId
                ? { ...m, _id: ack.messageId, tempId: undefined, timestamp: ack.createdAt }
                : m
            )
          );
        } else {
          // rollback
          setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
          alert("Media send failed!");
        }
      }
    );

    // ✅ reset file input (same file select again possible)
    e.target.value = "";
  } catch (err) {
    console.error("❌ Media upload error:", err);
    alert("Media upload failed!");
  } finally {
    setIsUploadingMedia(false);
  }
};

  const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream);   // ✅ recorder variable
    mediaRecorderRef.current = recorder;

    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

   recorder.onstop = async () => {
  try {
    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

    const formData = new FormData();
    formData.append("audio", audioBlob, "voice.webm");

    const res = await axios.post(`${BASE_URL}/upload-audio`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });

    const audioUrl = res.data.audioUrl;

    // ✅ Optimistic UI for audio
    const tempId = `temp-audio-${Date.now()}-${Math.random()}`;

    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        tempId,
        senderId: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        timestamp: new Date(),

        messageType: "audio",
        audioUrl,
        audioDuration: recordTime,
        status: "sent",
      },
    ]);

    // ✅ Send voice message socket with callback
    const socket = getSocket(userId);

    socket.emit(
  isGroup ? "sendGroupMessage" : "sendMessage",
  isGroup
    ? {
        groupId,
        messageType: "audio",
        audioUrl,
        audioDuration: recordTime,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    : {
        targetuserId,
        messageType: "audio",
        audioUrl,
        audioDuration: recordTime,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      (ack) => {
        console.log("✅ voice ack:", ack);

        // ✅ replace temp with real messageId
        if (ack?.status === "sent") {
          setMessages((prev) =>
            prev.map((m) =>
              m.tempId === tempId
                ? { ...m, _id: ack.messageId, tempId: undefined, timestamp: ack.createdAt }
                : m
            )
          );
        } else {
          // ❌ rollback
          setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
          alert("Voice message failed!");
        }
      }
    );

    setRecordTime(0);
  } catch (err) {
    console.error("❌ Voice upload/send error:", err);
    alert("Voice message upload failed!");
  }
};


    recorder.start(); // ✅ FIXED (mediaRecorder ❌ -> recorder ✅)
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setRecordTime((prev) => prev + 1);
    }, 1000);

  } catch (err) {
    console.error("Mic permission denied:", err);
    alert("Microphone permission needed!");
  }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);

    clearInterval(timerRef.current);

    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());

    chunksRef.current = []; // ✅ clean
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const togglePlay = (msgId) => {
    const audio = audioRefs.current[msgId];
    if (!audio) return;

    // agar same msg already playing -> pause
    if (playingId === msgId) {
      audio.pause();
      setPlayingId(null);
      return;
    }

    // ✅ koi aur audio chal raha hai toh usko pause karo
    if (playingId && audioRefs.current[playingId]) {
      audioRefs.current[playingId].pause();
    }

    audio.play();
    setPlayingId(msgId);
  };

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
      if (!isGroup && targetuserId) {
        await fetchUserData(targetuserId);
      }


      // Then fetch messages
      const messageSave = isGroup
        ? await axios.get(`${BASE_URL}/group/${groupId}`, { withCredentials: true })
        : await axios.get(`${BASE_URL}/chat/${targetuserId}`, { withCredentials: true });

      setChatId(messageSave?.data?._id);
      if (isGroup) {
        setRecipientName(messageSave?.data?.groupInfo?.name || "Group");
      }


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
        const {
          SenderId,
          text,
          status,
          createdAt,

          isEdited,
          editedAt,

          isDeletedForEveryone,
          deletedAt,

          reactions,
          deletedFor,

          // ✅ Pin
          isPinned,
          pinnedAt,

          // ✅ Voice
          audioUrl,
          audioDuration,
          messageType,
          mediaUrl,
          mediaType,
          fileName,
          fileSize,
          mediaPublicId,
          downloadUrl,
        } = msg;

        return {
          _id: msg._id,

          senderId: SenderId?._id,
          firstName: SenderId?.firstName,
          lastName: SenderId?.lastName,

          // ✅ Text safe
          text: text || "",

          status: status || "sent",
          timestamp: createdAt,

          // ✅ Edit
          isEdited: !!isEdited,
          editedAt: editedAt || null,

          // ✅ Delete for everyone
          isDeletedForEveryone: !!isDeletedForEveryone,
          deletedAt: deletedAt || null,

          // ✅ Delete for me
          deletedFor: deletedFor || [],

          // ✅ Reactions
          reactions: reactions || [],

          // ✅ Pin
          isPinned: !!isPinned,
          pinnedAt: pinnedAt || null,

          // ✅ Voice
          audioUrl: audioUrl || null,
          audioDuration: audioDuration || 0,
          messageType: messageType || "text",

          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          fileName: fileName || null,
          fileSize: fileSize || 0,
          mediaPublicId: mediaPublicId || null,
          downloadUrl: downloadUrl || null,

        };
      });

      setMessages(chatmessage);
      const pinned = chatmessage.find((m) => m.isPinned);
      setPinnedMsg(pinned || null);
    } catch (error) {
      console.error("Error fetching messages:", error);
      // Still try to fetch user data even if messages fail
      await fetchUserData(targetuserId);
    }
  };

  useEffect(() => {
    saveMessage(targetuserId);
  }, [targetuserId]);

  // ✅ STEP-2: Mark messages as read when chat opens
    useEffect(() => {
      if (!userId || !targetuserId) return;

      const socket = getSocket(userId);
      console.log("📤 Emitting mark-messages-read", {
        userId,
        targetuserId,
      });

      if (!isGroup) {
  socket.emit("mark-messages-read", { targetuserId });
}


    }, [userId, targetuserId]);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket(userId);
    console.log("📤 Emitting", {
        userId,
        targetuserId,
      });

    // const doJoin = () => socket.emit("joinChat", { targetuserId });
    const doJoin = () => {
      if (isGroup) {
        socket.emit("joinGroup", { groupId }, (res) => {
          console.log("✅ joined group", res);
        });
      } else {
        socket.emit("joinChat", { targetuserId }, (res) => {
          console.log("✅ joined chat", res);
        });
      }
    };


    if (socket.connected) {
      doJoin();
    } else {
      socket.once("connect", doJoin);
    }

    // Create notification function
    const handleReceive = ({
      _id,
      text,
      firstName,
      lastName,
      senderId,
      createdAt,

      messageType,
      audioUrl,
      audioDuration,

      // ✅ media
      mediaUrl,
      mediaType,
      fileName,
      fileSize,
      mediaPublicId,
      downloadUrl,
    }) => {
      setMessages((prev) => {
        // ✅ prevent duplicate message by _id
        if (_id && prev.some((m) => m._id === _id)) return prev;

        return [
          ...prev,
          {
            _id,
            text: text || "",
            firstName,
            lastName,
            senderId,
            timestamp: createdAt || new Date(),

            messageType: messageType || "text",

            audioUrl: audioUrl || null,
            audioDuration: audioDuration || 0,

            // ✅ media
            mediaUrl: mediaUrl || null,
            mediaType: mediaType || null,
            fileName: fileName || null,
            fileSize: fileSize || 0,
            mediaPublicId: mediaPublicId || null,
            downloadUrl: downloadUrl || null,
          },
        ];
      });
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
    
    const handleMessagesRead = ({ readerId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId === userId
            ? { ...msg, status: "read" }
            : msg
        )
      );
    };

    const handleDelivered = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, status: "delivered" }
            : msg
        )
      );
    };

    const handleDeleteForMe = ({ messageId }) => {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    const handleDeleteForEveryone = ({ messageId }) => {
      console.log("🧨 delete-for-everyone received:", messageId);

      setMessages((prev) =>
        prev.map((m) =>
          m._id?.toString() === messageId?.toString()
            ? {
                ...m,
                isDeletedForEveryone: true,
                text: "This message was deleted",

                // ✅ force remove all types
                messageType: "text",
                audioUrl: null,
                audioDuration: 0,
                mediaUrl: null,
                mediaType: null,
                fileName: null,
                fileSize: 0,
                mediaPublicId: null,
              }
            : m
        )
      );
    };



    const handleEdited = ({ messageId, newText, editedAt }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, text: newText, isEdited: true, editedAt }
            : msg
        )
      );
    };

    const handleReacted = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, reactions } : m
        )
      );
    };

   const handlePinned = ({ messageId }) => {
      setMessages((prev) => {
        const updated = prev.map((m) => ({
          ...m,
          isPinned: m._id === messageId,
        }));

        const found = updated.find((m) => m._id === messageId);
        if (found) setPinnedMsg(found);   // ✅ same updated array se

        return updated;
      });
    };


    const handleUnpinned = () => {
      setMessages((prev) => prev.map((m) => ({ ...m, isPinned: false })));
      setPinnedMsg(null);
    };

    socket.on("connect", doJoin);
    socket.off("receiveMessage");
    socket.off("receiveGroupMessage");

    if (isGroup) {
      socket.on("receiveGroupMessage", handleReceive);
    } else {
      socket.on("receiveMessage", handleReceive);
    }

    socket.on("updateUserStatus", handleStatus);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-ended", handleCallEnded);
    socket.on("messages-read", handleMessagesRead);
    socket.on("message-delivered", handleDelivered);
    socket.on("message-deleted-for-me", handleDeleteForMe);
    socket.on("message-deleted-for-everyone", handleDeleteForEveryone);
    socket.on("message-edited", handleEdited);
    socket.on("message-reacted", handleReacted);
    socket.on("message-pinned", handlePinned);
    socket.on("message-unpinned", handleUnpinned);
    
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
      socket.off("message-delivered", handleDelivered);
      socket.off("messages-read", handleMessagesRead);
      socket.off("message-deleted-for-me", handleDeleteForMe);
      socket.off("message-deleted-for-everyone", handleDeleteForEveryone);
      socket.off("message-edited", handleEdited);
      socket.off("message-reacted", handleReacted);
      socket.off("message-pinned", handlePinned);
      socket.off("message-unpinned", handleUnpinned);

      if (presenceTimer) clearTimeout(presenceTimer);
      if (periodicPresenceCheck) clearInterval(periodicPresenceCheck);
      // Do not disconnect globally here; component unmount shouldn't kill app-wide socket
    };
  }, [userId, targetuserId, user?.firstName]);

  // Reconnect hone par room dobara join karne ke liye
  useEffect(() => {
    if (!userId) return;

    const socket = getSocket(userId);

    const handleReconnect = () => {

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
        isGroup ? "sendGroupMessage" : "sendMessage",
      isGroup
      ? {
          groupId,
          text: messageText,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      : {
          text: messageText,
          targetuserId,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        (res) => {
          if (res?.status === "sent") {
            // Confirm message
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
            // Failed → rollback
            console.error("Message failed:", res?.message);

            setMessages((prev) =>
              prev.filter((msg) => msg.tempId !== tempId)
            );
          }
        }
      );
      };

      const openDeleteModal = (msg) => {
        console.log("🟡 openDeleteModal called:", msg);
        setSelectedMsg(msg);
        setShowDeleteModal(true);
      };

      const deleteForMe = () => {

        if (!selectedMsg?._id || !chatId) {
          console.log("❌ Missing selectedMsg._id or chatId");
          return;
        }

        const socket = getSocket(userId);

        socket.emit("delete-message-for-me", {
          chatId,
          messageId: selectedMsg._id,
        });

        setShowDeleteModal(false);
        setSelectedMsg(null);
      };

      const deleteForEveryone = () => {
        if (!selectedMsg?._id || !chatId) return;

        const socket = getSocket(userId);
        socket.emit("delete-message-for-everyone", {
          chatId,
          messageId: selectedMsg._id,
          targetuserId, // useful for room emit
        });

        setShowDeleteModal(false);
        setSelectedMsg(null);
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
            onClick={() => navigate("/app")}
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
            onClick={() => navigate("/app")}
            className="hidden lg:flex px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 items-center justify-center text-sm font-medium text-white backdrop-blur-sm border border-white/10 hover:border-white/20"
            title="Go Back"
          >
            ← Back
          </button>
          
          {/* Call Icons */}
{!isGroup && <>
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
          </>}
        </div>
      </div>
      {pinnedMsg && (
        <div className="px-6 py-2 bg-yellow-500/10 border-b border-yellow-400/20 text-yellow-200 flex items-center justify-between gap-3">
          <div
            className="cursor-pointer flex-1 truncate"
            onClick={() => {
              document.getElementById(`msg-${pinnedMsg._id}`)?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }}
          >
            📌 <span className="font-semibold">Pinned:</span>{" "}
            <span className="opacity-90">{pinnedMsg.text}</span>
          </div>

          <button
            onClick={() => {
              const socket = getSocket(userId);
              socket.emit("unpin-message", { chatId });
            }}
            className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 hover:bg-yellow-500/30"
          >
            Unpin
          </button>
        </div>
      )}

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
            // const isOwnMessage = user.firstName === msg.firstName;
            const isOwnMessage = msg.senderId === userId;

            const isTempMessage = msg.tempId;
            return (
              <div
                id={`msg-${msg._id}`}
                key={msg.tempId || msg.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-3 lg:mb-4`}
              >
                <div
                  className={`group relative max-w-[85%] sm:max-w-[75%] lg:max-w-[60%] xl:max-w-[50%] rounded-2xl px-4 py-3 lg:px-5 lg:py-4 shadow-lg backdrop-blur-sm border transition-all duration-300 ${
                    isOwnMessage
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-lg border-blue-400/30 shadow-blue-500/25"
                      : "bg-gradient-to-br from-gray-700/80 to-gray-800/80 text-white rounded-bl-lg border-gray-600/30 shadow-gray-900/50"
                  } ${isTempMessage ? "opacity-70 scale-95" : "hover:scale-[1.02]"}`}
                >
                  {/* Name - only show for other person's messages */}
                  {!isOwnMessage && (
                    <div className="text-xs lg:text-sm font-semibold mb-2 text-blue-300">
                      {msg.firstName} {msg.lastName}
                    </div>
                  )}

                  {/* Message Content + Buttons */}
                  <div className="relative flex items-start gap-3">
                    {/* Text */}
                    <div className="text-sm sm:text-base lg:text-lg break-words leading-relaxed flex-1 pr-2">
                     {msg.messageType === "audio" && !msg.isDeletedForEveryone ? (
                        // audio UI
                        <div className="flex items-center gap-3 w-full max-w-[280px]">
                          <button
                            onClick={() => togglePlay(msg._id)}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                            title={playingId === msg._id ? "Pause" : "Play"}
                          >
                            {playingId === msg._id ? "⏸️" : "▶️"}
                          </button>

                          <audio
                            ref={(el) => (audioRefs.current[msg._id] = el)}
                            src={msg.audioUrl}
                            onEnded={() => setPlayingId(null)}
                            className="hidden"
                          />

                          <div className="flex flex-col flex-1">
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full bg-green-400 transition-all duration-300 ${
                                  playingId === msg._id ? "w-full" : "w-0"
                                }`}
                              />
                            </div>

                            <div className="flex justify-between text-[11px] text-gray-300 mt-1">
                              <span>🎙️ Voice</span>
                              <span>{formatDuration(msg.audioDuration)}</span>
                            </div>
                          </div>
                        </div>
                      ) : msg.messageType === "media" && !msg.isDeletedForEveryone ? (
                        // ✅ MEDIA UI
                        msg.mediaType === "image" ? (
                          <img
                            src={msg.mediaUrl}
                            alt="media"
                            className="rounded-xl max-w-[240px] border border-white/10"
                          />
                        ) : msg.mediaType === "video" ? (
                          <video
                            src={msg.mediaUrl}
                            controls
                            className="rounded-xl max-w-[260px] border border-white/10"
                          />
                        ) : (
                                                
                       <a
                        onClick={() => downloadFile(msg.mediaUrl, msg.fileName || "file.pdf")}
                        className="underline text-blue-200"
                      >
                        📄 Download {msg.fileName || "File"}
                      </a>
                      )
                      ) : msg.isDeletedForEveryone ? (
                        <i className="text-gray-300 opacity-80">This message was deleted</i>
                      ) : (
                        msg.text
                      )}
                    </div>

                    {/* Top-right actions */}
                    {!msg.isDeletedForEveryone && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Edit */}
                        {isOwnMessage && (
                          <button
                            onClick={() => {
                              setEditingMsg(msg);
                              setEditText(msg.text);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-white/60 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10"
                            title="Edit"
                          >
                            ✏️
                          </button>
                        )}

                        {/* More */}
                        <button
                          onClick={() => {
                            console.log("🟢 3-dot clicked msg:", msg);
                            openDeleteModal(msg);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-white/60 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10"
                          title="More"
                        >
                          ⋮
                        </button>
                      </div>
                    )}
                    

                    {/* Reaction button bottom-right floating */}
                    {!msg.isDeletedForEveryone && (
                      <button
                        onClick={() => setReactionMsg(msg)}
                        className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-all duration-200 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 px-2 py-[3px] rounded-full text-xs shadow-md"
                        title="React"
                      >
                        😊
                      </button>

                    )}

                  </div>

                  {/* Footer: Time + Edited + Status */}
                  <div
                    className={`mt-3 flex items-center gap-2 text-[10px] lg:text-xs opacity-70 ${
                      isOwnMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.isPinned && (
                      <span className="text-yellow-300 text-xs flex items-center gap-1">
                        📌 
                      </span>
                    )}
                    
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {msg.isEdited && (
                      <span className="text-[10px] lg:text-xs text-gray-200">(edited)</span>
                    )}

                    {isTempMessage && <span className="animate-spin">⏳</span>}

                    {isOwnMessage && !isTempMessage && (
                      <span className="text-xs">
                        {msg.status === "sent" && <span className="text-gray-300">✓</span>}
                        {msg.status === "delivered" && <span className="text-gray-300">✓✓</span>}
                        {msg.status === "read" && <span className="text-green-400">✓✓</span>}
                      </span>
                    )}
                  </div>

                  {/* Reactions chips (attached at bottom) */}
                  {msg.reactions?.length > 0 && (
                    <div
                      className={`mt-2 flex gap-1 flex-wrap ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.reactions.map((r) => (
                        <span
                          key={`${r.userId}-${r.emoji}`}
                          className="px-2 py-[2px] bg-white/10 rounded-full text-xs backdrop-blur-sm border border-white/10 shadow-sm"
                        >
                          {r.emoji}
                        </span>
                      ))}
                    </div>
                  )}
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
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,.pdf"
          onChange={handleMediaSelect}
        />

        {/* Attach Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingMedia}
          className="p-3 rounded-2xl bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-300 flex-shrink-0 border border-gray-600/30 hover:border-gray-500/50 backdrop-blur-sm"
          title="Attach media"
        >
          {isUploadingMedia ? "⏳" : "📎"}
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
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-2xl transition-all duration-300 flex-shrink-0 backdrop-blur-sm border group ${
              isRecording
                ? "bg-red-500/80 hover:bg-red-600/80 border-red-400/50 shadow-lg shadow-red-500/25"
                : "bg-gray-700/50 hover:bg-gray-600/50 border-gray-600/30 hover:border-gray-500/50"
            }`}
            title={isRecording ? "Stop Recording" : "Record Voice"}
          >
            {isRecording ? `⏹️ ${recordTime}s` : "🎙️"}
          </button>
          
        )}
      </div>
    </div>

    {/* delete modal */}
    {showDeleteModal && selectedMsg && (
      <div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        onClick={() => setShowDeleteModal(false)}
      >

        <div
          className="bg-slate-800 p-6 rounded-2xl w-[90%] max-w-sm border border-gray-600"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-white text-lg font-bold mb-4">Delete message?</h3>

          <div className="flex flex-col gap-3">
            <button
              onClick={deleteForMe}
              className="w-full py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white"
            >
              Delete for me
            </button>

        <button
            onClick={() => {
              const socket = getSocket(userId);
              socket.emit("pin-message", {
                chatId,
                messageId: selectedMsg._id,
              });
              closeDeleteModal(); // optional
            }}
            className="w-full py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white"
          >
            📌 Pin Message
        </button>
            {selectedMsg.senderId === userId && (
              <button
                onClick={deleteForEveryone}
                className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white"
              >
                Delete for everyone
              </button>
            )}

            <button
              onClick={() => setShowDeleteModal(false)}
              className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {editingMsg && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 w-full max-w-md rounded-2xl p-6 border border-gray-700">
          <h2 className="text-white font-bold text-lg mb-4">Edit Message</h2>

          <input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none"
          />

          <div className="flex gap-3 mt-4 justify-end">
            <button
              onClick={() => setEditingMsg(null)}
              className="px-4 py-2 rounded-xl bg-gray-700 text-white"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                const socket = getSocket(userId);

                socket.emit("edit-message", {
                  chatId,
                  messageId: editingMsg._id,
                  newText: editText,
                });

                setEditingMsg(null);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}

    {reactionMsg && (
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        onClick={() => setReactionMsg(null)}
      >
        <div
          className="bg-gray-900 p-4 rounded-2xl border border-gray-700 flex gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          {["👍", "❤️", "😂", "😮", "😢", "😡"].map((emo) => (
            <button
              key={emo}
              onClick={() => {
                const socket = getSocket(userId);
                socket.emit("react-message", {
                  chatId,
                  messageId: reactionMsg._id,
                  emoji: emo,
                });
                setReactionMsg(null);
              }}
              className="text-2xl hover:scale-125 transition-transform"
            >
              {emo}
            </button>
          ))}
        </div>
      </div>
    )}
    </>
  );
};

export default Message;
