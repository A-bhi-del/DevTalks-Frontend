import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import MediaCall from "../utils/mediaSoupClient";
import getSocket from "../utils/socket";
import axios from "axios";
import { BASE_URL } from "../utils/constants";

const VoiceCall = ({ isOpen, onClose, recipientName, recipientId, callId, localUserId, isCaller = false }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState(isCaller ? 'ringing' : 'connecting');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const mediaCallRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const intervalRef = useRef(null);
  const socket = getSocket();

  // Socket Event Listeners for Call Signaling
  useEffect(() => {
    if (!isOpen || !callId) return;

    const handleAccepted = (data) => {
      if (data.callId === callId) {
        console.log("✅ Voice Call Accepted by remote user");
        setCallStatus('connected');
      }
    };

    const handleRejected = (data) => {
      if (data.callId === callId) {
        setCallStatus('rejected');
        setTimeout(endCallAndClose, 2000);
      }
    };

    const handleEnded = (data) => {
      if (data.callId === callId) {
        setCallStatus('ended');
        setTimeout(endCallAndClose, 2000);
      }
    };

    socket.on('call-accepted', handleAccepted);
    socket.on('call-rejected', handleRejected);
    socket.on('call-ended', handleEnded);

    return () => {
      socket.off('call-accepted', handleAccepted);
      socket.off('call-rejected', handleRejected);
      socket.off('call-ended', handleEnded);
    };
  }, [isOpen, callId, socket]);

  // Auto-end if no answer after 30s
  useEffect(() => {
    if (isCaller && callStatus === 'ringing') {
      const timeout = setTimeout(() => {
        setCallStatus('no-answer');
        setTimeout(endCallAndClose, 2000);
      }, 30000);
      return () => clearTimeout(timeout);
    }
  }, [isCaller, callStatus]);

  // Initialize MediaSoup when component opens
  useEffect(() => {
    if (isOpen && callId) {
      initializeCall();
    }
    return () => {
      if (mediaCallRef.current) {
        mediaCallRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, callId]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [callStatus]);

  // Sync audio ref when remote stream changes
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const initializeCall = async () => {
    try {
      console.log("🎤 Initializing Voice Call with MediaSoup...");
      // audioOnly: true for voice calls
      mediaCallRef.current = new MediaCall(callId, localUserId, { audioOnly: true });

      // CRITICAL: Set the callback BEFORE calling init()
      mediaCallRef.current.onRemoteStream = (remote) => {
        console.log("🔊 Received Remote Audio Stream");
        setRemoteStream(remote);
        // If we receive a stream, we are definitely connected
        setCallStatus('connected');
      };

      // Initialize local stream (audio only) - this also consumes existing producers
      const stream = await mediaCallRef.current.init();
      setLocalStream(stream);

    } catch (err) {
      console.error('❌ Voice Call init failed:', err);
      setCallStatus('ended');
    }
  };

  const endCallAndClose = async () => {
    if (mediaCallRef.current) {
      mediaCallRef.current.close();
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }

    // Notify backend
    try {
      await axios.post(`${BASE_URL}/call/end`, { callId }, { withCredentials: true });
    } catch (err) {
      console.error("Error ending call API:", err);
    }

    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsSpeakerOn(!remoteAudioRef.current.muted);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-8 max-w-md w-full mx-4 text-center shadow-2xl border border-gray-700">

        {/* Call Status Indicator */}
        <div className="mb-8">
          {/* Avatar/Icon */}
          <div className={`w-28 h-28 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg ${callStatus === 'connected'
            ? 'bg-green-500 shadow-green-500/30'
            : callStatus === 'ringing'
              ? 'bg-blue-500 shadow-blue-500/30 animate-pulse'
              : 'bg-gray-600'
            }`}>
            <Phone className="w-14 h-14 text-white" />
          </div>

          {/* Recipient Name */}
          <h2 className="text-2xl font-bold text-white mb-2">{recipientName}</h2>

          {/* Status Text */}
          <p className={`text-lg ${callStatus === 'connected' ? 'text-green-400' : 'text-gray-400'}`}>
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'ringing' && 'Ringing...'}
            {callStatus === 'connected' && formatDuration(callDuration)}
            {callStatus === 'ended' && 'Call ended'}
            {callStatus === 'rejected' && 'Call rejected'}
            {callStatus === 'no-answer' && 'No answer'}
          </p>
        </div>

        {/* Hidden Audio Elements */}
        <audio ref={remoteAudioRef} autoPlay />

        {/* Call Controls */}
        <div className="flex justify-center space-x-6">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${isMuted
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
          >
            {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>

          {/* Speaker Button */}
          <button
            onClick={toggleSpeaker}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${isSpeakerOn
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
          >
            {isSpeakerOn ? <Volume2 className="w-7 h-7" /> : <VolumeX className="w-7 h-7" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCallAndClose}
            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all transform hover:scale-110 shadow-lg shadow-red-500/50"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>

        {/* Ringing animation text */}
        {callStatus === 'ringing' && (
          <p className="text-sm text-gray-500 mt-8 animate-pulse">Waiting for response...</p>
        )}
      </div>
    </div>
  );
};

export default VoiceCall;
