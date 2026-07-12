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
    showMsgSearch, toggleMsgSearch, msgSearchQuery, msgSearchResults, searchMessages,
    viewProfile, viewingProfile, closeProfile,
    blockUser,
  } = useChatStore();
  
  const { sendMessage, sendTyping, stopTyping, joinGroup, setCallbacks, socket } = useSocket();
  const { smartReplies, clearSmartReplies, translateMessage, correctGrammar, summarizeChat } = useAIStore();

  const [input, setInput] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [translateLang, setTranslateLang] = useState('Hindi');
  const [translatedMsg, setTranslatedMsg] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showPinnedBar, setShowPinnedBar] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
  
  const chatId = selectedUser?._id || selectedGroup?._id || '';
  const isLight = theme === 'light';

  // FIX: register socket callbacks. onReceiveMessage now (1) always reads the
  // CURRENT selected chat from the store (avoids stale-closure bugs) and
  // (2) only appends the message if it actually belongs to the open chat.
  useEffect(() => {
    audioNotificationRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2357/2357-84.wav');

    setCallbacks({
      onIncomingCall: (data) => setIncomingCall(data),
      onCallEnded: () => { setActiveCall(null); setIncomingCall(null); },
      onReceiveMessage: (newMsg) => {
        if (!newMsg) return;

        const { selectedUser: curUser, selectedGroup: curGroup } = useChatStore.getState();

        const senderId = (newMsg.sender?._id || newMsg.sender || '').toString();
        const receiverId = (newMsg.receiver?._id || newMsg.receiver || '').toString();
        const groupIdOfMsg = (newMsg.groupId?._id || newMsg.groupId || '').toString();

        const belongsToCurrentChat =
          (curGroup && groupIdOfMsg && groupIdOfMsg === curGroup._id.toString()) ||
          (curUser && !groupIdOfMsg && (
            senderId === curUser._id.toString() || receiverId === curUser._id.toString()
          ));

        if (!belongsToCurrentChat) return;

        audioNotificationRef.current?.play().catch(() => {});

        useChatStore.setState((state) => {
          if (state.messages.some(m => m._id === newMsg._id)) return state;
          return { messages: [...state.messages, newMsg] };
        });
      }
    });
  }, [setCallbacks]);

  useEffect(() => {
    if (selectedUser) { getMessages(selectedUser._id); getPinnedMessages(); }
    if (selectedGroup) { getGroupMessages(selectedGroup._id); getPinnedMessages(); joinGroup(selectedGroup._id); }
    setInput('');
    setSelfDestructMode(false);
    setSelectedLabel('');
  }, [selectedUser, selectedGroup, getMessages, getGroupMessages, getPinnedMessages, joinGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // FIX: no more fake "temp" message + no more getMessages() refetch after send.
  // We just emit through the socket; the server now always echoes the real
  // saved message back (see socketHandler.js), and onReceiveMessage above
  // appends it once it's actually confirmed in the DB — no more disappearing.
  const handleSend = async (text, customLabel) => {
    const content = text || input;
    if (!content.trim()) return;

    if (content.trim().startsWith('/imagine')) {
      setInput('');
      setShowImageGenerator(true);
      return;
    }

    const payload = {
      sender: user._id,
      content,
      type: 'text',
      receiver: selectedUser?._id || null,
      groupId: selectedGroup?._id || null,
      replyTo: replyTo?._id || null,
      isSelfDestruct: selfDestructMode,
      selfDestructSeconds: selfDestructMode ? selfDestructSeconds : null,
      label: customLabel || selectedLabel || null
    };

    setInput('');
    setSelectedLabel('');
    clearSmartReplies();
    clearReplyingTo();

    sendMessage(payload);
  };

  const handleTriggerSummary = async () => {
    try {
      setShowHeaderMenu(false);
      setSummaryLoading(true);
      setSummary('');
      setShowSummary(true);
      const s = await summarizeChat(messages);
      setSummary(s || "Could not generate transaction text logs summary.");
    } catch (err) {
      console.error(err);
      setSummary("Failed to link with intelligence API server.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const executeForward = async (targetContactId) => {
    if (!forwardingMsg) return;
    sendMessage({
      sender: user._id,
      content: forwardingMsg.content,
      type: forwardingMsg.type || 'text',
      fileUrl: forwardingMsg.fileUrl || '',
      receiver: targetContactId,
      isForwarded: true
    });
    setForwardingMsg(null);
  };

  const handleImageSend = (imageData) => {
    sendMessage({
      sender: user._id,
      content: `🎨 ${imageData.prompt}`,
      type: 'image',
      fileUrl: imageData.imageUrl,
      receiver: selectedUser?._id || null,
      groupId: selectedGroup?._id || null,
    });
  };

  const handleFileUpload = (fileData) => {
    sendMessage({
      sender: user._id,
      content: fileData.originalName || 'File',
      type: fileData.type === 'image' ? 'image' : fileData.type === 'video' ? 'video' : fileData.type === 'audio' ? 'audio' : 'pdf',
      fileUrl: fileData.url,
      receiver: selectedUser?._id || null,
      groupId: selectedGroup?._id || null,
      replyTo: replyTo?._id || null,
    });
    clearReplyingTo();
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape' && replyTo) clearReplyingTo();
  };

  const scrollToMessage = (messageId) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-purple-400', 'rounded-2xl');
      setTimeout(() => el.classList.remove('ring-2', 'ring-purple-400', 'rounded-2xl'), 1500);
    }
  };

  const chatName = selectedUser?.name || selectedGroup?.name;
  const isGroup = !!selectedGroup;

  const bgStyle = wallpaper
    ? wallpaper.startsWith('url(')
      ? { backgroundImage: wallpaper, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: wallpaper }
    : { background: isLight ? '#f0f2f5' : '#0a0a14' };

  return (
    <div className="chat-layout w-full h-full relative" style={bgStyle}>
      {wallpaper && <div className="absolute inset-0 bg-black/20 pointer-events-none z-0" />}

      <div className={`chat-header relative z-10 px-4 pt-12 pb-3 flex items-center gap-3 backdrop-blur-xl border-b ${isLight ? 'bg-white/95 border-gray-200' : 'bg-[#1a0a2e]/95 border-white/10'}`}>
        <button onClick={onBack} className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/10 hover:bg-white/20 text-white'}`}>←</button>

        <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => selectedUser && viewProfile(selectedUser._id)}>
          <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0">
            {selectedUser?.avatar
              ? <img src={selectedUser.avatar} alt="avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">{chatName?.charAt(0).toUpperCase()}</div>
            }
          </div>
          <div className="min-w-0">
            <p className={`font-semibold text-sm truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{chatName}</p>
            {typingUsers.length > 0
              ? <p className="text-green-500 text-xs animate-pulse">typing...</p>
              : <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
                  {selectedUser ? (onlineUsers?.includes(selectedUser._id) ? '🟢 online' : 'offline') : `${selectedGroup?.members?.length} members`}
                </p>
            }
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedUser && (
            <>
              <button onClick={() => setActiveCall({ type: 'voice', isIncoming: false })} className={`w-9 h-9 rounded-full flex items-center justify-center ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'}`}>📞</button>
              <button onClick={() => setActiveCall({ type: 'video', isIncoming: false })} className={`w-9 h-9 rounded-full flex items-center justify-center ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'}`}>📹</button>
            </>
          )}
          <div className="relative">
            <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className={`w-9 h-9 rounded-full flex items-center justify-center text-xl ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'}`}>⋮</button>
            {showHeaderMenu && (
              <div className={`absolute right-0 top-11 w-48 rounded-2xl shadow-2xl z-30 overflow-hidden border ${isLight ? 'bg-white border-gray-200' : 'bg-[#1e1e30] border-white/10'}`}>
                {[
                  selectedUser && { label: '👤 Profile', action: () => { viewProfile(selectedUser._id); setShowHeaderMenu(false); } },
                  { label: '🎨 Wallpaper', action: () => { setShowWallpaperPicker(true); setShowHeaderMenu(false); } },
                  { label: '🖼️ AI Image', action: () => { setShowImageGenerator(true); setShowHeaderMenu(false); }, color: 'text-purple-400' },
                  { label: '📝 Summary', action: handleTriggerSummary },
                  { label: '🔍 Search', action: () => { toggleMsgSearch(); setShowHeaderMenu(false); } },
                  { label: '📌 Pinned', action: () => { setShowPinnedBar(!showPinnedBar); setShowHeaderMenu(false); } },
                  { label: `💣 ${selfDestructMode ? '✅ ' : ''}Self-Destruct`, action: () => { setSelfDestructMode(!selfDestructMode); setShowHeaderMenu(false); }, color: selfDestructMode ? 'text-red-400' : '' },
                  selectedUser && { label: '🚫 Block', action: () => { setShowBlockConfirm(true); setShowHeaderMenu(false); }, color: 'text-red-400' },
                ].filter(Boolean).map((item, i) => (
                  <button key={i} onClick={item.action} className={`w-full text-left px-4 py-3 text-sm transition-colors ${isLight ? 'hover:bg-gray-50 text-gray-700' : 'hover:bg-white/5 text-white'} ${item.color || ''}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="chat-messages relative z-10 px-4 py-4 space-y-2 flex-1 overflow-y-auto">
        {loading && <div className="text-center py-4 text-white/30 text-sm">Loading...</div>}
        {messages.map((msg) => (
          <div key={msg._id} ref={(el) => { messageRefs.current[msg._id] = el; }}>
            <MessageBubble msg={msg} isMe={msg.sender?._id === user._id || msg.sender === user._id} isGroup={isGroup} onScrollToMessage={scrollToMessage} theme={theme} onForward={(m) => setForwardingMsg(m)} />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input relative z-10 px-4 pb-8 pt-2 backdrop-blur-xl border-t bg-[#0f0f1a]/90 border-white/5">
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 items-center">
          <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider flex-shrink-0">Labels:</span>
          {['Work', 'Urgent', 'Personal', 'Important'].map((labelName) => (
            <button key={labelName} onClick={() => setSelectedLabel(selectedLabel === labelName ? '' : labelName)} className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition-all border ${selectedLabel === labelName ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-white/50'}`}>🏷️ {labelName}</button>
          ))}
          <div className="h-4 w-px bg-white/10 mx-1 flex-shrink-0" />
          {[
            { label: '✨ Grammar', action: async () => { if (!input.trim()) return; const c = await correctGrammar(input); setInput(c); } },
            { label: '🌍 Translate', action: () => setShowTranslate(!showTranslate) },
            { label: '🎨 /imagine', action: () => setShowImageGenerator(true) },
          ].map((tool) => (
            <button key={tool.label} onClick={tool.action} className="whitespace-nowrap text-[10px] px-3 py-1 rounded-full border border-white/10 text-white/40">{tool.label}</button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-3xl px-4 py-3 flex items-end gap-2 border bg-white/5 border-white/10 focus-within:border-purple-400/50">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-xl pb-0.5">😊</button>
            <textarea
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              className="flex-1 bg-transparent text-sm focus:outline-none leading-relaxed text-white"
            />
            <button onClick={() => setShowFileUpload(true)} className="text-xl pb-0.5">📎</button>
            <button onClick={() => setShowVoiceRecorder(true)} className="text-xl pb-0.5">🎤</button>
          </div>
          <button onClick={handleSend} className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">➤</span>
          </button>
        </div>
      </div>

      {showFileUpload && <FileUpload onUpload={handleFileUpload} onClose={() => setShowFileUpload(false)} />}
      {showVoiceRecorder && <VoiceRecorder onUpload={handleFileUpload} onClose={() => setShowVoiceRecorder(false)} />}
      {viewingProfile && <ProfileModal viewingUser={viewingProfile} onClose={closeProfile} />}
      {showWallpaperPicker && <WallpaperPicker chatId={chatId} currentWallpaper={wallpaper} onSelect={(url) => { setWallpaper(url); setShowWallpaperPicker(false); }} onClose={() => setShowWallpaperPicker(false)} />}
      {showImageGenerator && <ImageGeneratorModal onSend={handleImageSend} onClose={() => setShowImageGenerator(false)} />}
      {activeCall && selectedUser && <VideoCall socket={socket} currentUser={user} selectedUser={selectedUser} onClose={() => setActiveCall(null)} isIncoming={activeCall.isIncoming} incomingSignal={activeCall.signal} />}
    </div>
  );
}