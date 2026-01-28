import React, { useEffect } from 'react'
import Navbar from './navbar'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { BASE_URL } from '../utils/constants'
import { useDispatch, useSelector } from 'react-redux'
import { addUser } from '../utils/userSlice'
import axios from 'axios'
import { CallProvider, useCall } from '../utils/CallContext'
import IncomingCall from './IncomingCall'
import VideoCall from './VideoCall'
import VoiceCall from './VoiceCall'

// Inner component that uses the call context
const BodyContent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Get call state from context
  const {
    showIncomingCall,
    showVideoCall,
    showVoiceCall,
    incomingCallData,
    currentCallId,
    isCallerForCurrentCall,
    recipientId,
    recipientName,
    userId,
    acceptCall,
    rejectCall,
    endCall,
  } = useCall();

  // Check if current route is message page
  const isMessagePage = location.pathname.startsWith('/app/message/ ') || location.pathname === '/app/chats' || location.pathname.startsWith('/app/chats/');

  const fetchUser = async () => {
    // No user in Redux or localStorage - try to fetch from API
    try {
      const res = await axios.get(BASE_URL + "/profile/view", {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      dispatch(addUser(res.data));
    } catch (err) {

      if (err.response?.status === 401 || err.code === 'ERR_NETWORK') {
        // Only redirect to login if we're not already on login page
        if (location.pathname !== '/login' && location.pathname !== '/signup') {
          navigate("/login");
        }
      }
    }
  }

  useEffect(() => {
    fetchUser(); // ye site ke load hote hai.. sabse pahle authontication check krega if you are not authenticated than login page par navigate kr dega
  }, [])

  return (
    <div className='bg-gradient-to-br from-gray-900 via-black to-gray-800 min-h-screen'>
      {!isMessagePage && <Navbar />}
      <Outlet />

      {/* Global Incoming Call Modal */}
      {showIncomingCall && incomingCallData && (
        <IncomingCall
          isOpen={showIncomingCall}
          onClose={() => rejectCall()}
          callerName={incomingCallData.fromUserName || 'Unknown'}
          callerId={incomingCallData.fromUserId}
          callType={incomingCallData.callType}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* Global Video Call Modal */}
      {showVideoCall && currentCallId && (
        <VideoCall
          isOpen={showVideoCall}
          onClose={endCall}
          recipientName={recipientName}
          recipientId={recipientId}
          callId={currentCallId}
          localUserId={userId}
          isCaller={isCallerForCurrentCall}
        />
      )}

      {/* Global Voice Call Modal */}
      {showVoiceCall && currentCallId && (
        <VoiceCall
          isOpen={showVoiceCall}
          onClose={endCall}
          recipientName={recipientName}
          recipientId={recipientId}
          callId={currentCallId}
          localUserId={userId}
          isCaller={isCallerForCurrentCall}
        />
      )}
    </div>
  )
}

const Body = () => {
  return (
    <CallProvider>
      <BodyContent />
    </CallProvider>
  )
}

export default Body

