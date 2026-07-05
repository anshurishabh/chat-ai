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
import GifPicker from './GifPicker';
import ProfileModal from './ProfileModal';
import WallpaperPicker from './WallpaperPicker';
import ConfirmModal from './ConfirmModal';
import ImageGeneratorModal from './ImageGeneratorModal';
import ScheduleModal from './ScheduleModal';
import PollCreator from './PollCreator';
import SharedNoteModal from './SharedNoteModal';
import CalendarModal from './CalendarModal';
import BillSplitModal from './BillSplitModal';
import MiniGame from './MiniGame';
import StarredModal from './StarredModal';
import LocationShare from './LocationShare';

export default function ChatWindow({ onBack }) {
  const { user, theme } = useAuthStore();
  const {
    selectedUser, selectedGroup, messages, getMessages, getGroupMessages,
    typingUsers, loading, onlineUsers,
    replyingTo, clearReplyingTo,
    pinnedMessages, getPinnedMessages,
    showMsgSearch, toggleMsgSearch, msgSearchQuery, msgSearchResults, searchMessages,
    viewProfile, viewingProfile, closeProfile,
    blockUser,
  } = useChatStore();
  const { sendMessage, sendTyping, stopTyping, joinGroup, setCallbacks, socket } = useSocket();
  const { smartReplies, clearSmartReplies, translateMessage, summarizeChat, correctGrammar } = useAIStore();

  const [input, setInput] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [translateLang, setTranslateLang] = useState('Hindi');
  const [translatedMsg, setTranslatedMsg] = useState('');
  const [summary, setSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [showPinnedBar, setShowPinnedBar] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [wallpaper, setWallpaper] = useState('');
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showImagineHint, setShowImagineHint] = useState(false);
  const [selfDestructMode, setSelfDestructMode] = useState(false);
  const [selfDestructSeconds, setSelfDestructSeconds] = useState(30);
  const [showPoll, setShowPoll] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [chatUsers, setChatUsers] = useState([]);

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const messageRefs = useRef({});
  const chatId = selectedUser?._id || selectedGroup?._id || '';

  const isLight = theme === 'light';

  useEffect(() => {
    setCallbacks({
      onIncomingCall: (data) => setIncomingCall(data),
      onCallEnded: () => { setActiveCall(null); setIncomingCall(null); },
    });
  }, []);

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      getPinnedMessages();
      setChatUsers([selectedUser]);
    }
    if (selectedGroup) {
      getGroupMessages(selectedGroup._id);
      getPinnedMessages();
      joinGroup(selectedGroup._id);
      setChatUsers(selectedGroup.members || []);
    }
    clearSmartReplies();
    clearReplyingTo();
    setSummary('');
    setShowSummary(false);
    setShowPinnedBar(false);
    setShowHeaderMenu(false);
    setInput('');
    setShowImagineHint(false);
    setSelfDestructMode(false);
  }, [selectedUser, selectedGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text, scheduledAt = null) => {
    const content = text || input;
    if (!content.trim()) return;

    if (content.trim().startsWith('/imagine')) {
      setInput('');
      setShowImageGenerator(true);
      setShowImagineHint(false);
      return;
    }

    const messageData = {
      sender: user._id,
      content,
      type: 'text',
      receiver: selectedUser?._id || null,
      groupId: selectedGroup?._id || null,
      replyTo: replyingTo?._id || null,
      isSelfDestruct: selfDestructMode,
      selfDestructSeconds: selfDestructMode ? selfDestructSeconds : null,
      scheduledAt: scheduledAt || null,
    };

    sendMessage(messageData);
    setInput('');
    clearSmartReplies();
    clearReplyingTo();
    setShowImagineHint(false);
  };

  const handleGifSelect = (url, title) => {
    const messageData = {
      sender: user._id,
      content: title || 'GIF',
      type: 'image',
      fileUrl: url,
      receiver: selectedUser?._id || null,
      groupId: selectedGroup?._id || null,
    };
    sendMessage(messageData);
    setShowGifPicker(false);
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
      replyTo: replyingTo?._id || null,
    });
    clearReplyingTo();
  };

  const handleLocationShare = (locationData) => {
    sendMessage({
      sender: user._id,
      content: locationData.content,
      type: 'text',
      receiver: selectedUser?._id || null,
      groupId: selectedGroup?._id || null,
    });
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setInput(value);
    setShowImagineHint(value.startsWith('/ima'));
    if (selectedUser) {
      sendTyping({ sender: user._id, receiver: selectedUser._id });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => stopTyping({ sender: user._id, receiver: selectedUser._id }), 1500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape' && replyingTo) clearReplyingTo();
  };

  const scrollToMessage = (messageId) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-purple-400', 'rounded-2xl');
      setTimeout(() => el.classList.remove('ring-2', 'ring-purple-400', 'rounded-2xl'), 1500);
    }
  };

  const APPS = [
    { icon: '📊', label: 'Poll', action: () => { setShowPoll(true); setShowAppsMenu(false); } },
    { icon: '📝', label: 'Note', action: () => { setShowNote(true); setShowAppsMenu(false); } },
    { icon: '🗓️', label: 'Calendar', action: () => { setShowCalendar(true); setShowAppsMenu(false); } },
    { icon: '💰', label: 'Split Bill', action: () => { setShowBill(true); setShowAppsMenu(false); } },
    { icon: '🎮', label: 'Games', action: () => { setShowGame(true); setShowAppsMenu(false); } },
    { icon: '📍', label: 'Location', action: () => { setShowLocation(true); setShowAppsMenu(false); } },
    { icon: '⭐', label: 'Starred', action: () => { setShowStarred(true); setShowAppsMenu(false); } },
    { icon: '🎨', label: 'AI Image', action: () => { setShowImageGenerator(true); setShowAppsMenu(false); } },
  ];

  const chatName = selectedUser?.name || selectedGroup?.name;
  const isGroup = !!selectedGroup;

  const bgStyle = wallpaper
    ? wallpaper.startsWith('url(')
      ? { backgroundImage: wallpaper, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: wallpaper }
    : {};

  return (
    <div className="chat-layout w-full h-full relative overflow-hidden" style={bgStyle} data-theme={theme}>
      {wallpaper && <div className="absolute inset-0 bg-black/25 pointer-events-none z-0" />}

      {/* HEADER */}
      <div className={`chat-header relative z-10 px-4 pt-12 pb-3 flex items-center gap-3 ${isLight ? 'bg-white/95 border-b border-gray-200' : 'bg-[#1a0a2e]/95 border-b border-white/10'} backdrop-blur-xl`}>
        <button onClick={onBack} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/10 hover:bg-white/20 text-white'}`}>←</button>

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
              : <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/40'}`}>{selectedUser ? (onlineUsers?.includes(selectedUser._id) ? '🟢 online' : 'offline') : `${selectedGroup?.members?.length} members`}</p>
            }
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedUser && (
            <>
              <button onClick={() => setActiveCall({ type: 'voice', isIncoming: false })} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'}`}>📞</button>
              <button onClick={() => setActiveCall({ type: 'video', isIncoming: false })} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'}`}>📹</button>
            </>
          )}
          <div className="relative">
            <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className={`w-9 h-9 rounded-full flex items-center justify-center text-xl transition-colors ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'}`}>⋮</button>
            {showHeaderMenu && (
              <div className={`absolute right-0 top-11 w-52 rounded-2xl shadow-2xl z-30 overflow-hidden border ${isLight ? 'bg-white border-gray-200' : 'bg-[#1e1e30] border-white/10'}`}>
                {[
                  selectedUser && { label: '👤 Profile', action: () => { viewProfile(selectedUser._id); setShowHeaderMenu(false); } },
                  { label: '🎨 Wallpaper', action: () => { setShowWallpaperPicker(true); setShowHeaderMenu(false); } },
                  { label: '📝 Summary', action: () => { summarizeChat(messages).then(s => { setSummary(s); setShowSummary(true); }); setShowHeaderMenu(false); } },
                  { label: '🔍 Search', action: () => { toggleMsgSearch(); setShowHeaderMenu(false); } },
                  { label: '📌 Pinned', action: () => { setShowPinnedBar(!showPinnedBar); setShowHeaderMenu(false); } },
                  { label: '⭐ Starred', action: () => { setShowStarred(true); setShowHeaderMenu(false); } },
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

      {/* Self-destruct bar */}
      {selfDestructMode && (
        <div className="relative z-10 px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
          <span className="text-red-400 text-xs font-semibold">💣 Self-Destruct ON</span>
          <div className="flex items-center gap-2">
            <select value={selfDestructSeconds} onChange={(e) => setSelfDestructSeconds(Number(e.target.value))} className="bg-transparent text-red-400 text-xs border border-red-500/30 rounded-lg px-2 py-0.5">
              <option value={10}>10 sec</option>
              <option value={30}>30 sec</option>
              <option value={60}>1 min</option>
              <option value={300}>5 min</option>
              <option value={3600}>1 hour</option>
            </select>
            <button onClick={() => setSelfDestructMode(false)} className="text-red-400 text-xs hover:underline">Cancel</button>
          </div>
        </div>
      )}

      {/* Search bar */}
      {showMsgSearch && (
        <div className={`relative z-10 px-4 py-2 border-b backdrop-blur ${isLight ? 'bg-white/95 border-gray-200' : 'bg-[#1a0a2e]/80 border-white/10'}`}>
          <input autoFocus value={msgSearchQuery} onChange={(e) => searchMessages(e.target.value)} placeholder="Search messages..." className={`w-full px-4 py-2 rounded-full border text-sm focus:outline-none ${isLight ? 'bg-gray-100 border-gray-200 text-gray-900 focus:border-purple-400' : 'bg-white/10 border-white/20 text-white focus:border-purple-400'}`} />
          {msgSearchQuery && msgSearchResults.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {msgSearchResults.map((m) => (
                <div key={m._id} onClick={() => { scrollToMessage(m._id); toggleMsgSearch(); }} className={`px-3 py-2 rounded-xl cursor-pointer ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white/5 hover:bg-white/10'}`}>
                  <p className="text-purple-400 text-xs font-semibold">{m.sender?.name}</p>
                  <p className={`text-xs truncate ${isLight ? 'text-gray-600' : 'text-white'}`}>{m.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pinned bar */}
      {showPinnedBar && pinnedMessages.length > 0 && (
        <div className="relative z-10 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 backdrop-blur">
          <p className="text-yellow-400 text-xs font-semibold mb-1">📌 Pinned</p>
          {pinnedMessages.slice(0, 3).map((m) => (
            <div key={m._id} onClick={() => scrollToMessage(m._id)} className={`text-xs truncate cursor-pointer hover:text-yellow-300 py-0.5 ${isLight ? 'text-gray-600' : 'text-white/60'}`}>
              {m.sender?.name}: {m.content}
            </div>
          ))}
        </div>
      )}

      {/* Summary popup */}
      {showSummary && summary && (
        <div className={`absolute top-24 left-4 right-4 rounded-2xl p-4 z-40 shadow-2xl backdrop-blur border ${isLight ? 'bg-white/95 border-gray-200' : 'bg-[#1e1e30]/95 border-purple-500/30'}`}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-purple-400 font-semibold text-sm">📝 Summary</p>
            <button onClick={() => setShowSummary(false)} className="text-white/40 hover:text-white">✕</button>
          </div>
          <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-700' : 'text-white'}`}>{summary}</p>
        </div>
      )}

      {/* Incoming call */}
      {incomingCall && !activeCall && (
        <div className="absolute top-24 left-4 right-4 bg-[#1e1e30]/95 border border-green-500/30 rounded-2xl p-4 z-40 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl animate-pulse">
                {incomingCall.callerName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold">{incomingCall.callerName}</p>
                <p className="text-white/40 text-xs">Incoming {incomingCall.isVoiceOnly ? 'voice' : 'video'} call...</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIncomingCall(null)} className="w-12 h-12 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-2xl">📵</button>
              <button
                onClick={() => { setActiveCall({ type: incomingCall.isVoiceOnly ? 'voice' : 'video', isIncoming: true, signal: incomingCall.signal }); setIncomingCall(null); }}
                className="w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center text-2xl animate-bounce"
              >📞</button>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div className="chat-messages relative z-10 px-4 py-4 space-y-2">
        {loading && <div className="text-center py-4 text-white/30 text-sm">Loading...</div>}
        {messages.map((msg) => {
          const isMe = msg.sender._id === user._id || msg.sender === user._id;
          return (
            <div key={msg._id} ref={(el) => { messageRefs.current[msg._id] = el; }} className="animate-fadeIn">
              <MessageBubble
                msg={msg}
                isMe={isMe}
                isGroup={isGroup}
                onScrollToMessage={scrollToMessage}
                theme={theme}
                onForward={(m) => setForwardMsg(m)}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Smart replies */}
      {smartReplies.length > 0 && (
        <div className="relative z-10 px-4 pb-2 flex gap-2 overflow-x-auto">
          {smartReplies.map((reply, i) => (
            <button key={i} onClick={() => handleSend(reply)} className={`whitespace-nowrap text-xs px-3 py-2 rounded-full border transition-all flex-shrink-0 ${isLight ? 'bg-white border-gray-200 text-gray-700 hover:border-purple-400' : 'bg-white/10 border-white/20 text-white hover:border-purple-400'}`}>
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Translate preview */}
      {translatedMsg && (
        <div className={`relative z-10 mx-4 mb-2 rounded-2xl px-4 py-3 border ${isLight ? 'bg-purple-50 border-purple-200' : 'bg-white/5 border-white/10'}`}>
          <p className="text-purple-400 text-xs mb-1">🌍 {translateLang}:</p>
          <p className={`text-sm ${isLight ? 'text-gray-800' : 'text-white'}`}>{translatedMsg}</p>
          <button onClick={() => { setInput(translatedMsg); setTranslatedMsg(''); }} className="text-purple-400 text-xs mt-1 hover:underline">Use ↑</button>
        </div>
      )}

      {/* Reply bar */}
      {replyingTo && (
        <div className={`relative z-10 mx-4 mb-2 border-l-2 border-purple-400 rounded-r-2xl px-4 py-2 flex items-center justify-between ${isLight ? 'bg-purple-50' : 'bg-white/5'}`}>
          <div className="min-w-0">
            <p className="text-purple-400 text-xs font-semibold">↩️ {replyingTo.sender?.name}</p>
            <p className={`text-xs truncate ${isLight ? 'text-gray-500' : 'text-white/50'}`}>{replyingTo.content || '📎'}</p>
          </div>
          <button onClick={clearReplyingTo} className="text-white/30 hover:text-white px-2">✕</button>
        </div>
      )}

      {/* /imagine hint */}
      {showImagineHint && (
        <div className="relative z-10 mx-4 mb-2">
          <div onClick={() => { setShowImageGenerator(true); setInput(''); setShowImagineHint(false); }} className="flex items-center gap-3 bg-purple-500/20 border border-purple-500/40 rounded-2xl px-4 py-3 cursor-pointer hover:bg-purple-500/30 transition-colors">
            <span className="text-2xl">🎨</span>
            <div>
              <p className="text-purple-300 text-sm font-semibold">Open AI Image Generator</p>
              <p className="text-white/40 text-xs">Tap to create</p>
            </div>
          </div>
        </div>
      )}

      {/* INPUT AREA */}
      <div className={`chat-input relative z-10 px-4 pb-8 pt-2 ${isLight ? 'bg-white/95 border-t border-gray-200' : 'bg-[#0f0f1a]/90 border-t border-white/5'} backdrop-blur-xl`}>

        {/* AI Tools row */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
          {[
            { label: '✨ Grammar', action: async () => { if (!input.trim()) return; const c = await correctGrammar(input); setInput(c); } },
            { label: '🌍 Translate', action: () => setShowTranslate(!showTranslate), active: showTranslate },
            { label: '🎨 /imagine', action: () => setShowImageGenerator(true), color: true },
            { label: '⏰ Schedule', action: () => setShowSchedule(true) },
            { label: `💣 ${selfDestructMode ? 'ON' : 'Destruct'}`, action: () => setSelfDestructMode(!selfDestructMode), danger: selfDestructMode },
          ].map((tool) => (
            <button key={tool.label} onClick={tool.action} className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-all flex-shrink-0 ${
              tool.danger ? 'border-red-500/50 text-red-400 bg-red-500/10' :
              tool.color ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' :
              tool.active ? 'border-purple-400 text-purple-300 bg-purple-500/20' :
              isLight ? 'border-gray-200 text-gray-500 hover:border-purple-400 hover:text-purple-500' :
              'border-white/10 text-white/40 hover:border-purple-400 hover:text-white'
            }`}>
              {tool.label}
            </button>
          ))}
          {showTranslate && (
            <>
              <select value={translateLang} onChange={(e) => setTranslateLang(e.target.value)} className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ${isLight ? 'bg-white border-gray-200 text-gray-700' : 'bg-[#1e1e30] border-white/20 text-white'}`}>
                {['Hindi','Spanish','French','German','Japanese','Arabic','English'].map(l => <option key={l}>{l}</option>)}
              </select>
              <button onClick={async () => { if (!input.trim()) return; const r = await translateMessage(input, translateLang); setTranslatedMsg(r); }} className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-bold flex-shrink-0">Go</button>
            </>
          )}
        </div>

        {/* Emoji + GIF pickers */}
        <div className="relative">
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-0 z-50">
              <EmojiPicker onSelect={(emoji) => { setInput(p => p + emoji); setShowEmojiPicker(false); }} onClose={() => setShowEmojiPicker(false)} />
            </div>
          )}
          {showGifPicker && (
            <div className="absolute bottom-16 left-12 z-50">
              <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
            </div>
          )}
        </div>

        {/* Apps menu */}
        {showAppsMenu && (
          <div className={`mb-3 grid grid-cols-4 gap-2 p-3 rounded-2xl border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'}`}>
            {APPS.map((app) => (
              <button key={app.label} onClick={app.action} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${isLight ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/10 text-white/70'}`}>
                <span className="text-2xl">{app.icon}</span>
                <span className="text-[10px]">{app.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main input row */}
        <div className="flex items-end gap-2">
          {/* Apps button */}
          <button
            onClick={() => setShowAppsMenu(!showAppsMenu)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${showAppsMenu ? 'bg-purple-500 text-white rotate-45' : isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
          >
            +
          </button>

          <div className={`flex-1 rounded-3xl px-4 py-3 flex items-end gap-2 transition-colors border ${isLight ? 'bg-gray-100 border-gray-200 focus-within:border-purple-400' : 'bg-white/5 border-white/10 focus-within:border-purple-400/50'}`}>
            <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }} className="text-xl pb-0.5 flex-shrink-0 hover:scale-110 transition-transform">😊</button>
            <button onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }} className={`text-xs pb-0.5 flex-shrink-0 font-bold px-1 ${isLight ? 'text-gray-500 hover:text-purple-500' : 'text-white/40 hover:text-purple-400'} transition-colors`}>GIF</button>
            <textarea
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder={selfDestructMode ? '💣 Self-destruct message...' : 'Message...'}
              rows={1}
              style={{ resize: 'none', maxHeight: '100px' }}
              className={`flex-1 bg-transparent text-sm focus:outline-none leading-relaxed ${isLight ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-white/30'}`}
            />
            <button onClick={() => setShowFileUpload(true)} className="text-xl pb-0.5 flex-shrink-0 hover:scale-110 transition-transform">📎</button>
            <button onClick={() => setShowVoiceRecorder(true)} className="text-xl pb-0.5 flex-shrink-0 hover:scale-110 transition-transform">🎤</button>
          </div>

          <button
            onClick={() => handleSend()}
            className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/25 flex-shrink-0"
          >
            <span className="text-white font-bold text-lg">➤</span>
          </button>
        </div>
      </div>

      {/* All Modals */}
      {showFileUpload && <FileUpload onUpload={handleFileUpload} onClose={() => setShowFileUpload(false)} />}
      {showVoiceRecorder && <VoiceRecorder onUpload={handleFileUpload} onClose={() => setShowVoiceRecorder(false)} />}
      {viewingProfile && <ProfileModal viewingUser={viewingProfile} onClose={closeProfile} />}
      {showWallpaperPicker && <WallpaperPicker chatId={chatId} currentWallpaper={wallpaper} onSelect={(url) => { setWallpaper(url); setShowWallpaperPicker(false); }} onClose={() => setShowWallpaperPicker(false)} />}
      {showImageGenerator && <ImageGeneratorModal onSend={handleImageSend} onClose={() => setShowImageGenerator(false)} />}
      {showSchedule && <ScheduleModal onSchedule={(date) => { handleSend(input, date); setShowSchedule(false); }} onClose={() => setShowSchedule(false)} />}
      {showPoll && <PollCreator chatId={chatId} groupId={selectedGroup?._id} onCreated={(poll) => { /* send poll as message */ handleSend(`📊 Poll: ${poll.question}`); }} onClose={() => setShowPoll(false)} />}
      {showNote && <SharedNoteModal chatId={chatId} onClose={() => setShowNote(false)} />}
      {showCalendar && <CalendarModal chatId={chatId} onClose={() => setShowCalendar(false)} />}
      {showBill && <BillSplitModal chatId={chatId} chatUsers={chatUsers} onClose={() => setShowBill(false)} />}
      {showGame && <MiniGame onClose={() => setShowGame(false)} />}
      {showStarred && <StarredModal onClose={() => setShowStarred(false)} onScrollTo={scrollToMessage} />}
      {showLocation && <LocationShare onShare={handleLocationShare} onClose={() => setShowLocation(false)} />}
      {showBlockConfirm && <ConfirmModal title={`Block ${selectedUser?.name}?`} message="They won't be able to message you anymore." confirmText="Block" danger onConfirm={async () => { await blockUser(selectedUser._id); setShowBlockConfirm(false); }} onCancel={() => setShowBlockConfirm(false)} />}
      {activeCall && selectedUser && <VideoCall socket={socket} currentUser={user} selectedUser={selectedUser} onClose={() => setActiveCall(null)} isIncoming={activeCall.isIncoming} incomingSignal={activeCall.signal} isVoiceOnly={activeCall.type === 'voice'} />}
    </div>
  );
}