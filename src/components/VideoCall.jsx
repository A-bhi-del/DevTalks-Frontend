import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';

const VideoCall = ({ isOpen, onClose, recipientName, recipientId }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, ringing, connected, ended
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const intervalRef = useRef(null);

  // Initialize call
  useEffect(() => {
    if (isOpen) {
      console.log('📹 VideoCall component mounted - initializing call');
      initializeCall();
    }
    return () => {
      console.log('📹 VideoCall component unmounting - cleaning up');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Don't auto-end call on unmount - let user control it
      // endCall();
    };
  }, [isOpen]);

  // Handle ESC key to end call
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && isOpen) {
        console.log('📹 ESC key pressed - ending call');
        endCall();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [callStatus]);

  const initializeCall = async () => {
    try {
      console.log('📹 Initializing video call...');
      setCallStatus('connecting');
      
      // Get user media for camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log('📹 Camera and microphone access granted');
      setLocalStream(stream);
      
      // Set up local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('📹 Local video stream set up');
      }
      
      // Simulate call progression
      console.log('📹 Call status: connecting');
      setTimeout(() => {
        console.log('📹 Call status: ringing');
        setCallStatus('ringing');
      }, 1000);
      
      setTimeout(() => {
        console.log('📹 Call status: connected');
        setCallStatus('connected');
      }, 3000);
      
      // Don't auto-end the call - let user control it
      
    } catch (error) {
      console.error('❌ Error accessing camera/microphone:', error);
      setCallStatus('ended');
    }
  };

  const endCall = () => {
    console.log('📹 Ending video call...');
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      console.log('📹 Local stream stopped');
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      console.log('📹 Remote stream stopped');
    }
    setCallStatus('ended');
    console.log('📹 Call ended, closing interface...');
    setTimeout(() => onClose(), 1000);
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
        setIsVideoOn(!videoTrack.enabled);
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) {
    console.log('📹 VideoCall not open - not rendering');
    return null;
  }

  console.log('📹 VideoCall rendering - isOpen:', isOpen);

  return (
    <div className={`fixed inset-0 bg-black z-50 ${isFullscreen ? '' : 'flex items-center justify-center'}`}>
      <div className={`${isFullscreen ? 'w-full h-full' : 'w-full max-w-4xl mx-4 rounded-2xl overflow-hidden'} bg-black relative`}>
        {/* Close Button */}
        <button
          onClick={() => {
            console.log('📹 Close button clicked');
            onClose();
          }}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
          title="Close Call"
        >
          ✕
        </button>
        {/* Video Container */}
        <div className="relative w-full h-full">
          {/* Remote Video (Main) */}
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            {callStatus === 'connected' ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-white">
                <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Video className="w-16 h-16" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{recipientName}</h3>
                <p className="text-gray-300">
                  {callStatus === 'connecting' && 'Connecting...'}
                  {callStatus === 'ringing' && 'Ringing...'}
                  {callStatus === 'ended' && 'Call ended'}
                </p>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          {callStatus === 'connected' && (
            <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Call Info Overlay */}
          {callStatus === 'connected' && (
            <div className="absolute top-4 left-4 text-white">
              <h3 className="text-xl font-bold">{recipientName}</h3>
              <p className="text-sm text-gray-300">{formatDuration(callDuration)}</p>
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
          <div className="flex justify-center space-x-6">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white'
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Video Toggle Button */}
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isVideoOn ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={endCall}
              className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
