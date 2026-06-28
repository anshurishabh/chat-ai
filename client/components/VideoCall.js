'use client';
import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.relay.metered.ca:80' },
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: 'd42a7122de3bd7e3b92c55b5',
      credential: 'qi5XxaBUUycWtIQV'
    },
    {
      urls: 'turn:global.relay.metered.ca:80?transport=tcp',
      username: 'd42a7122de3bd7e3b92c55b5',
      credential: 'qi5XxaBUUycWtIQV'
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: 'd42a7122de3bd7e3b92c55b5',
      credential: 'qi5XxaBUUycWtIQV'
    },
    {
      urls: 'turns:global.relay.metered.ca:443?transport=tcp',
      username: 'd42a7122de3bd7e3b92c55b5',
      credential: 'qi5XxaBUUycWtIQV'
    }
  ]
};

export default function VideoCall({ socket, currentUser, selectedUser, onClose, isIncoming, incomingSignal, isVoiceOnly }) {
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Socket Listeners
    socket.on('call-accepted', (signal) => {
      if (peerRef.current) peerRef.current.signal(signal);
      setCallStatus('connected');
    });

    socket.on('call-ended', () => {
      cleanup();
      onClose();
    });

    if (!isIncoming) startCall();

    return () => cleanup();
  }, []);

  const cleanup = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    peerRef.current?.destroy();
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: !isVoiceOnly, audio: true });
      streamRef.current = stream;
      if (myVideo.current) myVideo.current.srcObject = stream;

      const peer = new SimplePeer({ initiator: true, trickle: true, stream, config: ICE_SERVERS });
      
      peer.on('signal', (signal) => {
        socket.emit('call-user', { to: selectedUser._id, from: currentUser._id, signal, callerName: currentUser.name, isVoiceOnly });
      });

      peer.on('stream', (remoteStream) => {
        if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
      });

      peerRef.current = peer;
    } catch (err) { alert('Access denied'); onClose(); }
  };

  const answerCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: !isVoiceOnly, audio: true });
      streamRef.current = stream;
      if (myVideo.current) myVideo.current.srcObject = stream;

      const peer = new SimplePeer({ initiator: false, trickle: true, stream, config: ICE_SERVERS });

      peer.on('signal', (signal) => {
        socket.emit('answer-call', { to: selectedUser._id, signal });
      });

      peer.on('stream', (remoteStream) => {
        if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
      });

      peer.signal(incomingSignal);
      peerRef.current = peer;
      setCallStatus('connected');
    } catch (err) { onClose(); }
  };

  const endCall = () => {
    socket.emit('end-call', { to: selectedUser._id });
    cleanup();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl overflow-hidden">
        <div className="relative bg-black h-96 flex items-center justify-center">
          <video ref={remoteVideo} autoPlay playsInline className="w-full h-full object-cover" />
          <video ref={myVideo} autoPlay playsInline muted className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-xl border-2 border-green-400" />
          
          {callStatus === 'incoming' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90">
              <p className="text-white mb-4">Incoming Call...</p>
              <div className="flex gap-4">
                <button onClick={answerCall} className="bg-green-500 p-4 rounded-full">📞</button>
                <button onClick={endCall} className="bg-red-500 p-4 rounded-full">📵</button>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 flex justify-center gap-6 bg-gray-800">
          <button onClick={endCall} className="bg-red-500 p-4 rounded-full text-2xl">End Call</button>
        </div>
      </div>
    </div>
  );
}