
'use client';
import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';

export default function VideoCall({ socket, currentUser, selectedUser, onClose, isIncoming, incomingSignal }) {
  const [callAccepted, setCallAccepted] = useState(false);
  const [stream, setStream] = useState(null);
  const [callLogs, setCallLogs] = useState('Initializing secure audio telemetry pipeline...');
  
  const myAudioRef = useRef(null);
  const userAudioRef = useRef(null);
  const connectionRef = useRef(null);

  useEffect(() => {
    const audioConstraints = {
      audio: { echoCancellation: true, noiseSuppression: true },
      video: false
    };

    navigator.mediaDevices.getUserMedia(audioConstraints)
      .then((localStream) => {
        setStream(localStream);
        setCallLogs('Microphone verified. Syncing proxy handshake channels...');
        
        if (myAudioRef.current) myAudioRef.current.srcObject = localStream;

        if (isIncoming) {
          const peer = new SimplePeer({ initiator: false, trickle: false, stream: localStream });

          peer.on('signal', (data) => {
            socket.emit('answer-call', { signal: data, to: selectedUser._id });
          });

          peer.on('stream', (remoteStream) => {
            setCallLogs('Lossless encrypted audio channel active.');
            if (userAudioRef.current) userAudioRef.current.srcObject = remoteStream;
          });

          peer.signal(incomingSignal);
          connectionRef.current = peer;
          setCallAccepted(true);
        } else {
          const peer = new SimplePeer({ initiator: true, trickle: false, stream: localStream });

          peer.on('signal', (data) => {
            socket.emit('call-user', {
              to: selectedUser._id,
              signal: data,
              from: currentUser._id,
              callerName: currentUser.name,
              isVoiceOnly: true
            });
            setCallLogs('Handshaking target node framework asset...');
          });

          peer.on('stream', (remoteStream) => {
            setCallLogs('Peer handshake active. Processing streams.');
            if (userAudioRef.current) userAudioRef.current.srcObject = remoteStream;
          });

          socket.on('call-accepted', (signal) => {
            setCallAccepted(true);
            setCallLogs('Voice secure loop established.');
            peer.signal(signal);
          });

          connectionRef.current = peer;
        }
      })
      .catch((err) => {
        console.error(err);
        setCallLogs('Microphone connection blocked by client rules.');
      });

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (connectionRef.current) connectionRef.current.destroy();
    };
  }, []);

  const handleEndCall = () => {
    socket.emit('end-call', { to: selectedUser._id });
    if (stream) stream.getTracks().forEach(track => track.stop());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-[150] flex flex-col items-center justify-center p-6">
      <div className="bg-[#121225] border border-purple-500/20 w-full max-w-sm rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-purple-500/20 mb-6 relative">
          <span>{selectedUser.name?.charAt(0).toUpperCase()}</span>
          {callAccepted && <span className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-4 border-[#121225] rounded-full animate-ping" />}
        </div>
        <h3 className="text-white font-bold text-xl mb-1">{selectedUser.name}</h3>
        <p className="text-purple-400 text-xs font-semibold tracking-wider uppercase mb-4">{callAccepted ? '🔒 Secured' : '📞 Calling'}</p>
        <div className="bg-black/30 border border-white/5 w-full rounded-2xl p-3 text-white/50 text-xs mb-8 font-mono min-h-[40px] flex items-center justify-center">{callLogs}</div>
        <audio ref={myAudioRef} autoPlay muted className="hidden" />
        <audio ref={userAudioRef} autoPlay className="hidden" />
        <button onClick={handleEndCall} className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all">🔴</button>
      </div>
    </div>
  );
}