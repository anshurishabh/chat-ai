'use client';
import { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

export default function VideoCall({ socket, currentUser, selectedUser, onClose, isIncoming, isVoiceOnly }) {
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const clientRef = useRef(null);
  const localTrackRef = useRef({ audio: null, video: null });

  const channelName = [currentUser._id, selectedUser._id].sort().join('-');

  useEffect(() => {
    if (!isIncoming) startCall();

    if (socket) {
      socket.on('call-accepted', () => {
        joinChannel();
      });

      socket.on('call-ended', () => {
        leaveChannel();
        onClose();
      });
    }

    return () => {
      leaveChannel();
      if (socket) {
        socket.off('call-accepted');
        socket.off('call-ended');
      }
    };
  }, []);

  const startCall = async () => {
    socket.emit('call-user', {
      to: selectedUser._id,
      from: currentUser._id,
      callerName: currentUser.name,
      isVoiceOnly,
      channel: channelName,
    });
    setCallStatus('calling');
    await joinChannel();
  };

  const answerCall = async () => {
    socket.emit('answer-call', {
      to: selectedUser._id,
      channel: channelName,
    });
    setCallStatus('connected');
    await joinChannel();
  };

  const joinChannel = async () => {
    try {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      await client.join(APP_ID, channelName, null, currentUser._id);

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localTrackRef.current.audio = audioTrack;

      let videoTrack = null;
      if (!isVoiceOnly) {
        videoTrack = await AgoraRTC.createCameraVideoTrack();
        localTrackRef.current.video = videoTrack;
        videoTrack.play('local-video');
      }

      await client.publish(isVoiceOnly ? [audioTrack] : [audioTrack, videoTrack]);

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          user.videoTrack.play('remote-video');
        }
        if (mediaType === 'audio') {
          user.audioTrack.play();
        }
        setCallStatus('connected');
      });

    } catch (err) {
      console.error('Agora join error:', err);
    }
  };

  const leaveChannel = async () => {
    localTrackRef.current.audio?.close();
    localTrackRef.current.video?.close();
    await clientRef.current?.leave();
  };

  const endCall = async () => {
    await leaveChannel();
    if (socket && selectedUser) {
      socket.emit('end-call', { to: selectedUser._id });
    }
    onClose();
  };

  const toggleMute = async () => {
    if (localTrackRef.current.audio) {
      await localTrackRef.current.audio.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localTrackRef.current.video) {
      await localTrackRef.current.video.setEnabled(isVideoOff);
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
          <div id="remote-video" className="w-full h-full" />
          <div id="local-video" className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-xl overflow-hidden border-2 border-green-400" />

          {/* Incoming Call UI */}
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

          {/* Calling UI */}
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