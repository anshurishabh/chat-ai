'use client';
import { useEffect, useRef, useState } from 'react';

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
const TOKEN = process.env.NEXT_PUBLIC_AGORA_TOKEN;
const CHANNEL = process.env.NEXT_PUBLIC_AGORA_CHANNEL || 'nexchat';

export default function VideoCall({ socket, currentUser, selectedUser, onClose, isIncoming, isVoiceOnly }) {
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);

  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const hasJoinedRef = useRef(false);
  const isMountedRef = useRef(true);
  const AgoraRTCRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;

    const init = async () => {
      // Load Agora SDK only in the browser
      const mod = await import('agora-rtc-sdk-ng');
      AgoraRTCRef.current = mod.default;

      if (!isIncoming && !hasJoinedRef.current) {
        hasJoinedRef.current = true;
        notifyAndJoin();
      }
    };
    init();

    if (socket) {
      socket.on('call-accepted', () => {
        setCallStatus('connected');
      });

      socket.on('call-ended', () => {
        leaveChannel();
        onClose();
      });
    }

    return () => {
      isMountedRef.current = false;
      leaveChannel();
      if (socket) {
        socket.off('call-accepted');
        socket.off('call-ended');
      }
    };
  }, []);

  const notifyAndJoin = async () => {
    socket.emit('call-user', {
      to: selectedUser._id,
      from: currentUser._id,
      callerName: currentUser.name,
      isVoiceOnly,
      channel: CHANNEL,
    });
    setCallStatus('calling');
    await joinChannel();
  };

  const joinChannel = async () => {
    try {
      if (!AgoraRTCRef.current) {
        const mod = await import('agora-rtc-sdk-ng');
        AgoraRTCRef.current = mod.default;
      }
      const AgoraRTC = AgoraRTCRef.current;

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);

        if (mediaType === 'video') {
          setRemoteUsers(prev => {
            if (prev.find(u => u.uid === user.uid)) return prev;
            return [...prev, user];
          });
          setTimeout(() => {
            user.videoTrack?.play(`remote-video-${user.uid}`);
          }, 500);
        }

        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }

        if (isMountedRef.current) setCallStatus('connected');
      });

      client.on('user-unpublished', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      await client.join(APP_ID, CHANNEL, TOKEN || null, currentUser._id);

      if (!isMountedRef.current) {
        await client.leave();
        return;
      }

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

      if (!isMountedRef.current) {
        audioTrack.close();
        await client.leave();
        return;
      }
      localAudioTrackRef.current = audioTrack;

      if (!isVoiceOnly) {
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        if (!isMountedRef.current) {
          videoTrack.close();
          audioTrack.close();
          await client.leave();
          return;
        }
        localVideoTrackRef.current = videoTrack;
        videoTrack.play('local-video');
        await client.publish([audioTrack, videoTrack]);
      } else {
        await client.publish([audioTrack]);
      }

      if (isMountedRef.current) setCallStatus('connected');
    } catch (err) {
      if (err?.code !== 'OPERATION_ABORTED') {
        console.error('Agora join error:', err);
      }
    }
  };

  const answerCall = async () => {
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;

    socket.emit('answer-call', {
      to: selectedUser._id,
      channel: CHANNEL,
    });
    setCallStatus('connected');
    await joinChannel();
  };

  const leaveChannel = async () => {
    try {
      localAudioTrackRef.current?.close();
      localVideoTrackRef.current?.close();
      await clientRef.current?.leave();
    } catch (err) {
      // ignore cleanup errors
    }
  };

  const endCall = async () => {
    await leaveChannel();
    if (socket && selectedUser) {
      socket.emit('end-call', { to: selectedUser._id });
    }
    onClose();
  };

  const toggleMute = async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      await localVideoTrackRef.current.setEnabled(isVideoOff);
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

          {remoteUsers.map(user => (
            <div
              key={user.uid}
              id={`remote-video-${user.uid}`}
              className="w-full h-full"
            />
          ))}

          {remoteUsers.length === 0 && callStatus === 'connected' && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4">
                  {selectedUser?.name?.charAt(0).toUpperCase()}
                </div>
                <p className="text-white text-sm">🎙️ Voice Connected</p>
              </div>
            </div>
          )}

          <div
            id="local-video"
            className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-xl overflow-hidden border-2 border-green-400"
          />

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
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${isMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isMuted ? '🔇' : '🎙️'}
          </button>
          <button
            onClick={endCall}
            className="w-16 h-16 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-2xl transition-all transform hover:scale-105"
          >
            📵
          </button>
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${isVideoOff ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isVideoOff ? '📵' : '📹'}
          </button>
        </div>
      </div>
    </div>
  );
}