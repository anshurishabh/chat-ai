'use client';
import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.relay.metered.ca:80' },
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: '1fd2c31a76c9eeedddcba13',
      credential: 'sqEQ5BkooAYRoTTH',
    },
    {
      urls: 'turn:global.relay.metered.ca:80?transport=tcp',
      username: '1fd2c31a76c9eeedddcba13',
      credential: 'sqEQ5BkooAYRoTTH',
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: '1fd2c31a76c9eeedddcba13',
      credential: 'sqEQ5BkooAYRoTTH',
    },
    {
      urls: 'turns:global.relay.metered.ca:443?transport=tcp',
      username: '1fd2c31a76c9eeedddcba13',
      credential: 'sqEQ5BkooAYRoTTH',
    },
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
    if (!isIncoming) {
      startCall();
    }
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    peerRef.current?.destroy();
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !isVoiceOnly,
        audio: true
      });
      streamRef.current = stream;
      if (myVideo.current) myVideo.current.srcObject = stream;

      const peer = new SimplePeer({
        initiator: true,
        trickle: true,
        stream,
        config: ICE_SERVERS
      });

      peer.on('signal', (signal) => {
        socket.emit('call-user', {
          to: selectedUser._id,
          from: currentUser._id,
          signal,
          callerName: currentUser.name,
          isVoiceOnly,
        });
      });

      peer.on('stream', (remoteStream) => {
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = remoteStream;
          remoteVideo.current.play().catch(console.error);
        }
        setCallStatus('connected');
      });

      peer.on('error', (err) => console.error('Peer error:', err));
      peer.on('close', () => { setCallStatus('ended'); onClose(); });
      peerRef.current = peer;
      setCallStatus('calling');
    } catch (err) {
      console.error('Call error:', err);
      alert('Camera/Microphone access denied!');
      onClose();
    }
  };

  const answerCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !isVoiceOnly,
        audio: true
      });
      streamRef.current = stream;
      if (myVideo.current) myVideo.current.srcObject = stream;

      const peer = new SimplePeer({
        initiator: false,
        trickle: true,
        stream,
        config: ICE_SERVERS
      });

      peer.on('signal', (signal) => {
        socket.emit('answer-call', { to: selectedUser._id, signal });
      });

      peer.on('stream', (remoteStream) => {
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = remoteStream;
          remoteVideo.current.play().catch(console.error);
        }
        setCallStatus('connected');
      });

      peer.on('error', (err) => console.error('Peer error:', err));
      peer.on('close', () => { setCallStatus('ended'); onClose(); });
      peer.signal(incomingSignal);
      peerRef.current = peer;
      setCallStatus('connected');
    } catch (err) {
      console.error('Answer error:', err);
      onClose();
    }
  };

  const endCall = () => {
    cleanup();
    if (socket && selectedUser) {
      socket.emit('end-call', { to: selectedUser._id });
    }
    onClose();
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl overflow-hidden border border-gray-700">

        {/* Header */}
        <div className="p-4 bg-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {selectedUser?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold">{selectedUser?.name}</p>
              <p className="text-xs text-gray-400">
                {callStatus === 'calling' ? '📞 Calling...' :
                 callStatus === 'incoming' ? '📲 Incoming call...' :
                 '🟢 Connected'}
              </p>
            </div>
          </div>
          <div className="text-green-400 text-sm font-mono">
            {callStatus === 'connected' ? '● LIVE' : ''}
          </div>
        </div>

        {/* Video Area */}
        <div className="relative bg-black" style={{ height: '400px' }}>
          <video ref={remoteVideo} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-xl overflow-hidden border-2 border-green-400">
            <video ref={myVideo} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>

          {callStatus === 'incoming' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl mb-4 animate-pulse">
                {selectedUser?.name?.charAt(0).toUpperCase()}
              </div>
              <p className="text-white text-xl font-semibold mb-2">{selectedUser?.name}</p>
              <p className="text-gray-400 text-sm mb-8">Incoming {isVoiceOnly ? 'voice' : 'video'} call...</p>
              <div className="flex gap-6">
                <button onClick={endCall} className="w-16 h-16 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-2xl">📵</button>
                <button onClick={answerCall} className="w-16 h-16 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center text-2xl animate-bounce">📞</button>
              </div>
            </div>
          )}

          {callStatus === 'calling' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl mb-4 animate-pulse">
                {selectedUser?.name?.charAt(0).toUpperCase()}
              </div>
              <p className="text-white text-xl font-semibold mb-2">{selectedUser?.name}</p>
              <p className="text-gray-400 text-sm mb-2">Calling...</p>
              <div className="flex gap-1 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-gray-800 flex items-center justify-center gap-4">
          <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${isMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
            {isMuted ? '🔇' : '🎙️'}
          </button>
          <button onClick={endCall} className="w-16 h-16 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-2xl transition-all transform hover:scale-105">
            📵
          </button>
          <button onClick={toggleVideo} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${isVideoOff ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
            {isVideoOff ? '📵' : '📹'}
          </button>
        </div>
      </div>
    </div>
  );
}