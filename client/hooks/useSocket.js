'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nexchat-server.onrender.com';

let globalSocket = null;
let callbackRegistry = {
  onIncomingCall: null,
  onCallEnded: null,
  onReceiveMessage: null
};

export default function useSocket() {
  const { user } = useAuthStore();
  
  useEffect(() => {
    if (!user || globalSocket) return;

    globalSocket = io(SOCKET_SERVER_URL, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling']
    });

    globalSocket.on('connect', () => {
      console.log('⚡ Connected to socket network cloud stream node:', globalSocket.id);
      globalSocket.emit('setupOnline', user._id);
    });

    globalSocket.on('messageReceived', (newMsg) => {
      if (callbackRegistry.onReceiveMessage) {
        callbackRegistry.onReceiveMessage(newMsg);
      }
    });

    globalSocket.on('hey', (data) => {
      if (callbackRegistry.onIncomingCall) {
        callbackRegistry.onIncomingCall({
          callerName: data.name,
          signal: data.signal,
          isVoiceOnly: true
        });
      }
    });

    globalSocket.on('callEnded', () => {
      if (callbackRegistry.onCallEnded) callbackRegistry.onCallEnded();
    });

    return () => {
      // Kept open across layouts switches to preserve session bindings
    };
  }, [user]);

  const setCallbacks = useCallback((objs) => {
    callbackRegistry = { ...callbackRegistry, ...objs };
  }, []);

  const sendMessage = useCallback((payload) => {
    globalSocket?.emit('newMessage', payload);
  }, []);

  const sendTyping = useCallback((payload) => {
    globalSocket?.emit('typing', payload);
  }, []);

  const stopTyping = useCallback((payload) => {
    globalSocket?.emit('stopTyping', payload);
  }, []);

  const joinGroup = useCallback((groupId) => {
    globalSocket?.emit('joinGroup', groupId);
  }, []);

  return {
    socket: globalSocket,
    sendMessage,
    sendTyping,
    stopTyping,
    joinGroup,
    setCallbacks
  };
}