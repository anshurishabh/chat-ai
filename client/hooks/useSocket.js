
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
      globalSocket.emit('user-online', user._id);
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