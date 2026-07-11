'use client';
import { useEffect, useRef, useState } from 'react';
import useChatStore from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';
import useAIStore from '../store/useAIStore';
import useSocket from '../hooks/useSocket';
import FileUpload from './FileUpload';
import VoiceRecorder from './VoiceRecorder';
import VideoCall from './VideoCall';
import MessageBubble from './MessageBubble';
import EmojiPicker from './EmojiPicker';
import ProfileModal from './ProfileModal';
import WallpaperPicker from './WallpaperPicker';
import ConfirmModal from './ConfirmModal';
import ImageGeneratorModal from './ImageGeneratorModal';

export default function ChatWindow({ onBack }) {
  const { user, theme } = useAuthStore();
  const {
    selectedUser, selectedGroup, messages, setMessages, getMessages, getGroupMessages,
    typingUsers, loading, onlineUsers, contacts,
    replyTo, clearReplyingTo,
    pinnedMessages, getPinnedMessages,
    showMsgSearch, toggleMsgSearch,
    viewProfile, viewingProfile, closeProfile,
    blockUser,
  } = useChatStore();
  
  const { sendMessage, sendTyping, stopTyping, joinGroup, setCallbacks, socket } = useSocket();
  const { clearSmartReplies, correctGrammar, summarizeChat } = useAIStore();

  const [input, setInput] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [wallpaper, setWallpaper] = useState('');
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [selfDestructMode, setSelfDestructMode] = useState(false);
  const [selfDestructSeconds, setSelfDestructSeconds] = useState(30);
  const [forwardingMsg, setForwardingMsg] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const messageRefs = useRef({});
  const audioNotificationRef = useRef(null);
  
  const isLight = theme === 'light';

  // 1. Core Real-Time Incoming Message Synchronization Engine
  useEffect(() => {
    // Standard secure audio context check
    if (typeof window !== 'undefined') {
      audioNotificationRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2357/2357-84.wav');
    }
    
    setCallbacks({
      onIncomingCall: () => {},
      onCallEnded: () => {},
      onReceiveMessage: (newMsg) => {
        if (!newMsg || !newMsg.sender) return;

        // Verify if message belongs to the currently active UI chat window
        const activeChatUser = useChatStore.getState().selectedUser;
        const activeChatGroup = useChatStore.getState().selectedGroup;

        const isCurrentChat = 
          (activeChatUser && (newMsg.sender._id === activeChatUser._id || newMsg.sender === activeChatUser._id)) ||
          (activeChatGroup && newMsg.groupId === activeChatGroup._id);

        if (isCurrentChat) {
          // SAFE UPDATE: Append to running messages array state dynamically
          useChatStore.setState((state) => {
            // Prevent duplicate renderings if message already exists in local array
            if (state.messages.some(m => m._id === newMsg._id)) return state;
            return { messages: [...state.messages, newMsg] };
          });
        }

        // Trigger dynamic sound notification
        if (audioNotificationRef.current) {
          audioNotificationRef.current.play().catch(() => {});
        }
      }
    });
  }, [setCallbacks]);

  // 2. Fetch Fresh Records from Database on Switch Chat Thread
  useEffect(() => {
    if (selectedUser) { 
      getMessages(selectedUser._id); 
      getPinnedMessages(); 
    }
    if (selectedGroup) { 
      getGroupMessages(selectedGroup._id); 
      getPinnedMessages(); 
      joinGroup(selectedGroup._id); 
    }
    clearSmartReplies();
    clearReplyingTo();
    setInput('');
    setSelfDestructMode(false);
    setSelectedLabel('');
  }, [selectedUser, selectedGroup]);

  // Auto Scroll Engine Layer
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Perfect Handshake Send Logic
  const handleSend = async (text, customLabel) => {
    const content = text || input;
    if (!content.trim()) return;

    if (content.trim().startsWith('/imagine')) {
      setInput('');
      setShowImageGenerator(true);
      return;
    }

    // Temporary absolute tracking block ID
    const tempId = 'msg_' + Date.now();
    const optimisticMessage = {
      _id: tempId,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      content: content,
      type: 'text',
      receiver: selectedUser?._id || null,
      groupId: selectedGroup?._id || null,
      replyTo: replyTo || null,
      isSelfDestruct: selfDestructMode,
      label: customLabel || selectedLabel || null,
      createdAt: new Date().toISOString(),
      readBy: []
    };

    // Render instantly to UI so user feels ultra-fast response speed
    useChatStore.setState((state) => ({
      messages: [...state.messages, optimisticMessage]
    }));

    setInput('');
    setSelectedLabel('');
    clearSmartReplies();
    clearReplyingTo();

    try {
      // Fire network payload package to background socket channels
      // Socket server will save this to MongoDB database and broadcast to receiver node
      sendMessage({
        sender: user._id,
        content,
        type: 'text',
        receiver: selectedUser?._id || null,
        groupId: selectedGroup?._id || null,
        replyTo: replyTo?._id || null,
        isSelfDestruct: selfDestructMode,
        selfDestructSeconds: selfDestructMode ? selfDestructSeconds : null,
        label: customLabel || selectedLabel || null
      });

      // Optional: Refetch after 800ms to ensure database state is perfectly synced
      setTimeout(() => {
        if (selectedUser) getMessages(selectedUser._id);
        if (selectedGroup) getGroupMessages(selectedGroup._id);
      }, 800);

    } catch (err) {
      console.error("Failed to safely dispatch packet via network layers:", err);
    }
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (selectedUser) {
      sendTyping({ sender: user._id, receiver: selectedUser._id });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => stopTyping({ sender: user._id, receiver: selectedUser._id }), 1500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleSend(); 
    }
  };

  const scrollToMessage = (messageId) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const chatName = selectedUser?.name || selectedGroup?.name;
  const isGroup = !!selectedGroup;

  const bgStyle = wallpaper
    ? wallpaper.startsWith('url(') ? { backgroundImage: wallpaper, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: wallpaper }
    : { background: isLight ? '#f0f2f5' : '#0a0a14' };

  return (
    <div className="chat-layout w-full h-full relative" style={bgStyle}>
      {wallpaper && <div className="absolute inset-0 bg-black/20 pointer-events-none z-0" />}

      {/* HEADER */}
      <div className={`chat-header relative z-10 px-4 pt-12 pb-3 flex items-center gap-3 backdrop-blur-xl border-b ${isLight ? 'bg-white/95 border-gray-200' : 'bg-[#1a0a2e]/95 border-white/10'}`}>
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white">←</button>
        <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => selectedUser && viewProfile(selectedUser._id)}>
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
            {chatName?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate text-white">{chatName}</p>
            <p className="text-xs text-white/40">
              {selectedUser ? (onlineUsers?.includes(selectedUser._id) ? '🟢 online' : 'offline') : `${selectedGroup?.members?.length} members`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedUser && (
            <button onClick={() => useChatStore.setState({ activeCall: { type: 'voice', isIncoming: false } })} className="w-10 h-10 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 hover:bg-purple-600/20">📞</button>
          )}
          <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className="w-9 h-9 rounded-full flex items-center justify-center text-xl text-white/60 hover:bg-white/10">⋮</button>
        </div>
      </div>

      {/* MESSAGES LAYER MAP */}
      <div className="chat-messages relative z-10 px-4 py-4 space-y-2 overflow-y-auto h-[calc(100vh-180px)]">
        {loading && <div className="text-center py-4 text-white/30 text-sm">Synchronizing Database Cloud...</div>}
        {messages.map((msg) => {
          const isMe = msg.sender?._id === user._id || msg.sender === user._id;
          return (
            <div key={msg._id} ref={(el) => { messageRefs.current[msg._id] = el; }}>
              <MessageBubble msg={msg} isMe={isMe} isGroup={isGroup} onScrollToMessage={scrollToMessage} theme={theme} onForward={(m) => setForwardingMsg(m)} />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT CONTROLS ACCENT BAR */}
      <div className="chat-input relative z-10 px-4 pb-8 pt-2 backdrop-blur-xl border-t bg-[#0f0f1a]/90 border-white/5">
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 items-center">
          <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider flex-shrink-0">AI Pipeline:</span>
          {['Urgent', 'Work', 'Personal'].map((l) => (
            <button key={l} onClick={() => setSelectedLabel(selectedLabel === l ? '' : l)} className={`text-[10px] px-2.5 py-1 rounded-md font-bold border ${selectedLabel === l ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-white/50'}`}>🏷️ {l}</button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-3xl px-4 py-3 flex items-end gap-2 border bg-white/5 border-white/10 focus-within:border-purple-400/50">
            <button onClick={() => setShowFileUpload(true)} className="text-xl hover:scale-110 transition-transform">📎</button>
            <textarea
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Type encryption message vector blocks..."
              rows={1}
              style={{ resize: 'none', maxHeight: '100px' }}
              className="flex-1 bg-transparent text-sm focus:outline-none text-white placeholder-white/30"
            />
          </div>
          <button onClick={() => handleSend()} className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/25">
            <span className="text-white font-bold text-lg">➤</span>
          </button>
        </div>
      </div>
    </div>
  );
}