import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';
import MediaCall from "../utils/mediaSoupClient";
import getSocket from "../utils/socket";
import axios from "axios";
import { BASE_URL } from "../utils/constants";

const VideoCall = ({ isOpen, onClose, recipientName, recipientId, callId, localUserId, isCaller = false }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  // Initial status depends on whether we are the caller
  const [callStatus, setCallStatus] = useState(isCaller ? 'ringing' : 'connecting');

  const mediaCallRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const intervalRef = useRef(null);
  const socket = getSocket();

  // Socket Event Listeners for Call Signaling
  useEffect(() => {
    if (!isOpen || !callId) return;

    const handleAccepted = (data) => {
      if (data.callId === callId) {
        console.log("✅ Call Accepted by remote user");
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
    // Cleanup on unmount
    return () => {
      if (mediaCallRef.current) {
        mediaCallRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, callId]);

  // Duration Timer
  useEffect(() => {
    if (callStatus === 'connected') {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [callStatus]);

  // Sync video refs when streams change (fixes race condition)
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const initializeCall = async () => {
    try {
      console.log("🚀 Initializing MediaSoup...");
      mediaCallRef.current = new MediaCall(callId, localUserId);

      // CRITICAL: Set the callback BEFORE calling init()
      // init() consumes existing producers internally and calls onRemoteStream
      // If we set it after init(), existing producer streams won't trigger the callback
      mediaCallRef.current.onRemoteStream = (remote) => {
        console.log("🌊 Received Remote Stream");
        setRemoteStream(remote);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;
        // If we receive a stream, we are definitely connected
        setCallStatus('connected');
      };

      // Initialize local stream (this also consumes existing producers)
      const stream = await mediaCallRef.current.init();
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    } catch (err) {
      console.error('❌ Call init failed:', err);
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

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled); // Fixed: was incorrectly inverted before
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black z-50 ${isFullscreen ? '' : 'flex items-center justify-center'}`}>
      <div className={`${isFullscreen ? 'w-full h-full' : 'w-full max-w-4xl mx-4 rounded-2xl overflow-hidden'} bg-gray-900 relative shadow-2xl border border-gray-800`}>

        {/* --- MAIN VIDEO AREA --- */}
        <div className="relative w-full h-full min-h-[500px] bg-gray-900 flex items-center justify-center">

          {/* 1. REMOTE VIDEO (If connected) */}
          {callStatus === 'connected' && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}

          {/* 2. PLACEHOLDER (If connecting/waiting) */}
          {callStatus !== 'connected' && callStatus !== 'ringing' && (
            <div className="text-center text-white z-10">
              <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                <Video className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{recipientName}</h3>
              <p className="text-gray-400 text-lg capitalize">{callStatus}...</p>
            </div>
          )}

          {/* 3. RINGING OVERLAY (Fixes overlapping issue) */}
          {(callStatus === 'ringing' || callStatus === 'no-answer' || callStatus === 'rejected') && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900 text-white">
              <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                <Video className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">{recipientName}</h2>
              <p className="text-xl text-blue-200 animate-pulse">
                {callStatus === 'ringing' ? 'Calling...' : callStatus}
              </p>
              {callStatus === 'ringing' && (
                <p className="text-sm text-gray-400 mt-8">Waiting for response...</p>
              )}
            </div>
          )}

          {/* 4. LOCAL VIDEO (Picture-in-Picture) */}
          {localStream && callStatus !== 'ended' && (
            <div className="absolute top-4 right-4 w-32 h-48 md:w-48 md:h-36 bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 shadow-xl z-30">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            </div>
          )}
        </div>

        {/* --- CONTROLS BAR --- */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-6 z-40">
          <button onClick={toggleMute} className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700/80 text-white hover:bg-gray-600'}`}>
            {isMuted ? <MicOff /> : <Mic />}
          </button>

          <button onClick={toggleVideo} className={`p-4 rounded-full transition-all ${!isVideoOn ? 'bg-white text-gray-900' : 'bg-gray-700/80 text-white hover:bg-gray-600'}`}>
            {!isVideoOn ? <VideoOff /> : <Video />}
          </button>

          <button onClick={endCallAndClose} className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/50 transform hover:scale-110 transition-all">
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default VideoCall;