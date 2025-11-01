import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, PhoneOff } from 'lucide-react';

const IncomingCall = ({ isOpen, onClose, callerName, callerId, callType, onAccept, onReject }) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isRinging, setIsRinging] = useState(true);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  // Play ringing sound
  useEffect(() => {
    if (isOpen && isRinging) {
      console.log('📞 Playing incoming call sound...');
      
      // Create audio context for ringing sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Generate ringing tone
      const playRingingTone = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      };

      // Play ringing tone every 2 seconds
      const ringingInterval = setInterval(playRingingTone, 2000);
      
      return () => {
        clearInterval(ringingInterval);
        audioContext.close();
      };
    }
  }, [isOpen, isRinging]);

  // Call duration timer
  useEffect(() => {
    if (isOpen) {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen]);

  const handleAccept = () => {
    console.log('📞 Incoming call accepted');
    setIsRinging(false);
    onAccept();
  };

  const handleReject = () => {
    console.log('📞 Incoming call rejected');
    setIsRinging(false);
    onReject();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center animate-pulse">
        {/* Caller Info */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            {callType === 'video' ? (
              <Video className="w-12 h-12 text-white" />
            ) : (
              <Phone className="w-12 h-12 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{callerName}</h2>
          <p className="text-gray-600">
            {callType === 'video' ? 'Incoming Video Call' : 'Incoming Voice Call'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {formatDuration(callDuration)}
          </p>
        </div>

        {/* Call Actions */}
        <div className="flex justify-center space-x-6">
          {/* Reject Button */}
          <button
            onClick={handleReject}
            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
            title="Reject Call"
          >
            <PhoneOff className="w-8 h-8" />
          </button>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors"
            title="Accept Call"
          >
            {callType === 'video' ? (
              <Video className="w-8 h-8" />
            ) : (
              <Phone className="w-8 h-8" />
            )}
          </button>
        </div>

        {/* Call Status */}
        <div className="mt-4 text-sm text-gray-500">
          {isRinging ? 'Ringing...' : 'Call in progress'}
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;
