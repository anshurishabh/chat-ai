
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';

// Dynamic production socket server link allocation logic
const getSocketURL = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'https://nexchat-server-w5gq.onrender.com';
    }
  }
  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketURL();
let socketInstance = null;

const useSocket = () => {
  const { user } = useAuthStore();
  const { addMessage, setOnlineUsers, addTypingUser, removeTypingUser } = useChatStore();
  const callbacksRef = useRef({});

  useEffect(() => {
    if (!user) return;

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true
      });
    }

    socketInstance.emit('user-online', user._id);

    socketInstance.on('online-users', (users) => setOnlineUsers(users));
    socketInstance.on('receive-message', (message) => addMessage(message));
    socketInstance.on('user-typing', (userId) => addTypingUser(userId));
    socketInstance.on('user-stop-typing', (userId) => removeTypingUser(userId));

    socketInstance.on('incoming-call', (data) => {
      if (callbacksRef.current.onIncomingCall) callbacksRef.current.onIncomingCall(data);
    });

    socketInstance.on('call-accepted', (signal) => {
      if (callbacksRef.current.onCallAccepted) callbacksRef.current.onCallAccepted(signal);
    });

    socketInstance.on('ice-candidate', (data) => {
      if (callbacksRef.current.onIceCandidate) callbacksRef.current.onIceCandidate(data);
    });

    socketInstance.on('call-ended', () => {
      if (callbacksRef.current.onCallEnded) callbacksRef.current.onCallEnded();
    });

    return () => {
      socketInstance.off('online-users');
      socketInstance.off('receive-message');
      socketInstance.off('user-typing');
      socketInstance.off('user-stop-typing');
      socketInstance.off('incoming-call');
      socketInstance.off('call-accepted');
      socketInstance.off('ice-candidate');
      socketInstance.off('call-ended');
    };
  }, [user]);

  const sendMessage = (data) => socketInstance?.emit('send-message', data);
  const sendTyping = (data) => socketInstance?.emit('typing', data);
  const stopTyping = (data) => socketInstance?.emit('stop-typing', data);
  const joinGroup = (groupId) => socketInstance?.emit('join-group', groupId);
  const callUser = (data) => socketInstance?.emit('call-user', data);
  const answerCall = (data) => socketInstance?.emit('answer-call', data);
  const endCall = (data) => socketInstance?.emit('end-call', data);
  const sendIceCandidate = (data) => socketInstance?.emit('ice-candidate', data);

  const setCallbacks = (callbacks) => {
    callbacksRef.current = { ...callbacksRef.current, ...callbacks };
  };

  return {
    sendMessage, sendTyping, stopTyping, joinGroup,
    callUser, answerCall, endCall, sendIceCandidate,
    setCallbacks, socket: socketInstance
  };
};

export default useSocket;