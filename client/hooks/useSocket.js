'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';

const getSocketURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Production (Vercel) — same backend as axios.js uses
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.') && !hostname.startsWith('10.')) {
      return 'https://nexchat-server-w5gq.onrender.com';
    }

    // Mobile local testing (laptop IP used on phone)
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return `http://${hostname}:5000`;
    }
  }
  // Local fallback
  return 'http://localhost:5000';
};

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

    globalSocket = io(getSocketURL(), {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling']
    });

    globalSocket.on('connect', () => {
      console.log('⚡ Connected to socket network cloud stream node:', globalSocket.id);
      globalSocket.emit('user-online', user._id);
    });

    globalSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection failed:', err.message);
    });

    // Event matches backend 'receive-message' perfectly now
    globalSocket.on('receive-message', (newMsg) => {
      if (callbackRegistry.onReceiveMessage) {
        callbackRegistry.onReceiveMessage(newMsg);
      }
    });

    // Event matches backend 'incoming-call' perfectly now
    globalSocket.on('incoming-call', (data) => {
      if (callbackRegistry.onIncomingCall) {
        callbackRegistry.onIncomingCall({
          callerName: data.callerName,
          signal: data.signal,
          from: data.from,
          isVoiceOnly: data.isVoiceOnly
        });
      }
    });

    globalSocket.on('call-accepted', (signal) => {
      const socketRegistry = globalSocket;
      if (socketRegistry) {
        socketRegistry.emit('callAccepted_fallback', signal);
      }
    });

    globalSocket.on('call-ended', () => {
      if (callbackRegistry.onCallEnded) callbackRegistry.onCallEnded();
    });

    return () => {};
  }, [user]);

  const setCallbacks = useCallback((objs) => {
    callbackRegistry = { ...callbackRegistry, ...objs };
  }, []);

  const sendMessage = useCallback((payload) => {
    globalSocket?.emit('send-message', payload);
  }, []);

  const sendTyping = useCallback((payload) => {
    globalSocket?.emit('typing', payload);
  }, []);

  const deleteMessage = useCallback((payload) => {
    globalSocket?.emit('stop-typing', payload);
  }, []);

  const joinGroup = useCallback((groupId) => {
    globalSocket?.emit('join-group', groupId);
  }, []);

  return {
    socket: globalSocket,
    sendMessage,
    sendTyping,
    stopTyping: deleteMessage,
    joinGroup,
    setCallbacks
  };
}