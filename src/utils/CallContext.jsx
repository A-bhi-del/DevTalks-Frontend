import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import getSocket from './socket';
import { BASE_URL } from './constants';

const CallContext = createContext(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  // Call state
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [isCallerForCurrentCall, setIsCallerForCurrentCall] = useState(false);
  const [recipientId, setRecipientId] = useState(null);
  const [recipientName, setRecipientName] = useState('');

  const user = useSelector((state) => state.user);
  const userId = user?._id;
  const socketRef = useRef(null);

  // Setup socket listeners for call events
  useEffect(() => {
    if (!userId) return;

    const socket = getSocket(userId);
    socketRef.current = socket;

    const handleIncomingCall = (data) => {
      console.log('📞 [CallContext] Incoming call received:', data);
      
      // Store the incoming call data
      setIncomingCallData(data);
      setCurrentCallId(data.callId);
      setIsCallerForCurrentCall(false);
      setRecipientId(data.fromUserId);
      setRecipientName(data.fromUserName || 'Unknown');
      setShowIncomingCall(true);
    };

    const handleCallAccepted = (data) => {
      console.log('✅ [CallContext] Call accepted:', data);
      if (data.callId === currentCallId) {
        setShowIncomingCall(false);
        // The VideoCall component will handle the connection
      }
    };

    const handleCallRejected = (data) => {
      console.log('❌ [CallContext] Call rejected:', data);
      if (data.callId === currentCallId) {
        setShowIncomingCall(false);
        setShowVideoCall(false);
        setShowVoiceCall(false);
        setCurrentCallId(null);
        setIncomingCallData(null);
      }
    };

    const handleCallEnded = (data) => {
      console.log('📴 [CallContext] Call ended:', data);
      if (data.callId === currentCallId) {
        setShowIncomingCall(false);
        setShowVideoCall(false);
        setShowVoiceCall(false);
        setCurrentCallId(null);
        setIncomingCallData(null);
      }
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
    };
  }, [userId, currentCallId]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCallData) return;

    try {
      console.log('✅ [CallContext] Accepting call:', incomingCallData.callId);

      await axios.post(
        `${BASE_URL}/call/accept`,
        { callId: incomingCallData.callId },
        { withCredentials: true }
      );

      setShowIncomingCall(false);
      setCurrentCallId(incomingCallData.callId);
      setIsCallerForCurrentCall(false);

      if (incomingCallData.callType === 'video') {
        setShowVideoCall(true);
      } else {
        setShowVoiceCall(true);
      }
    } catch (err) {
      console.error('❌ [CallContext] Accept call failed:', err);
    }
  }, [incomingCallData]);

  // Reject incoming call
  const rejectCall = useCallback(async () => {
    if (!incomingCallData) return;

    try {
      console.log('❌ [CallContext] Rejecting call:', incomingCallData.callId);

      await axios.post(
        `${BASE_URL}/call/reject`,
        { callId: incomingCallData.callId },
        { withCredentials: true }
      );

      setShowIncomingCall(false);
      setIncomingCallData(null);
      setCurrentCallId(null);
    } catch (err) {
      console.error('❌ [CallContext] Reject call failed:', err);
    }
  }, [incomingCallData]);

  // Initiate a call to someone
  const initiateCall = useCallback(async (targetUserId, targetUserName, callType = 'video') => {
    try {
      console.log(`📞 [CallContext] Initiating ${callType} call to:`, targetUserId);

      const res = await axios.post(
        `${BASE_URL}/call/initiate`,
        { toUserId: targetUserId, callType },
        { withCredentials: true }
      );

      if (!res?.data?.callId) {
        console.error('❌ [CallContext] Call initiation failed');
        return;
      }

      setCurrentCallId(res.data.callId);
      setIsCallerForCurrentCall(true);
      setRecipientId(targetUserId);
      setRecipientName(targetUserName || 'User');

      if (callType === 'video') {
        setShowVideoCall(true);
      } else {
        setShowVoiceCall(true);
      }
    } catch (err) {
      console.error('❌ [CallContext] Initiate call failed:', err);
    }
  }, []);

  // End the current call
  const endCall = useCallback(() => {
    setShowVideoCall(false);
    setShowVoiceCall(false);
    setShowIncomingCall(false);
    setCurrentCallId(null);
    setIncomingCallData(null);
    setIsCallerForCurrentCall(false);
  }, []);

  const value = {
    // State
    incomingCallData,
    showIncomingCall,
    showVideoCall,
    showVoiceCall,
    currentCallId,
    isCallerForCurrentCall,
    recipientId,
    recipientName,
    userId,
    // Actions
    acceptCall,
    rejectCall,
    initiateCall,
    endCall,
    setShowVideoCall,
    setShowVoiceCall,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};

export default CallContext;
