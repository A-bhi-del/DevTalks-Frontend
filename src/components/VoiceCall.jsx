import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const VoiceCall = ({ isOpen, onClose, recipientName, recipientId }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, ringing, connected, ended
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const intervalRef = useRef(null);

  // Initialize call
  useEffect(() => {
    if (isOpen) {
      console.log('🎤 VoiceCall component mounted - initializing call');
      initializeCall();
    }
    return () => {
      console.log('🎤 VoiceCall component unmounting - cleaning up');
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
        console.log('📞 ESC key pressed - ending call');
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
      console.log('🎤 Initializing voice call...');
      setCallStatus('connecting');
      
      // Get user media for microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      console.log('🎤 Microphone access granted');
      setLocalStream(stream);
      
      // Set up local audio
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        console.log('🎤 Local audio stream set up');
      }
      
      // Simulate call progression
      console.log('🎤 Call status: connecting');
      setTimeout(() => {
        console.log('🎤 Call status: ringing');
        setCallStatus('ringing');
      }, 1000);
      
      setTimeout(() => {
        console.log('🎤 Call status: connected');
        setCallStatus('connected');
      }, 3000);
      
      // Don't auto-end the call - let user control it
      
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      setCallStatus('ended');
    }
  };

  const endCall = () => {
    console.log('📞 Ending voice call...');
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      console.log('📞 Local stream stopped');
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      console.log('📞 Remote stream stopped');
    }
    setCallStatus('ended');
    console.log('📞 Call ended, closing interface...');
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

  if (!isOpen) {
    console.log('🎤 VoiceCall not open - not rendering');
    return null;
  }

  console.log('🎤 VoiceCall rendering - isOpen:', isOpen);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center relative">
        {/* Close Button */}
        <button
          onClick={() => {
            console.log('🎤 Close button clicked');
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
          title="Close Call"
        >
          ✕
        </button>
        {/* Call Status */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Phone className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{recipientName}</h2>
          <p className="text-gray-600">
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'ringing' && 'Ringing...'}
            {callStatus === 'connected' && formatDuration(callDuration)}
            {callStatus === 'ended' && 'Call ended'}
          </p>
        </div>

        {/* Audio Elements */}
        <audio ref={localAudioRef} autoPlay muted />
        <audio ref={remoteAudioRef} autoPlay />

        {/* Call Controls */}
        <div className="flex justify-center space-x-6 mb-6">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Speaker Button */}
          <button
            onClick={toggleSpeaker}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isSpeakerOn ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

        {/* Call Info */}
        <div className="text-sm text-gray-500">
          {callStatus === 'connected' && 'Tap to mute/unmute'}
        </div>
      </div>
    </div>
  );
};

export default VoiceCall;
