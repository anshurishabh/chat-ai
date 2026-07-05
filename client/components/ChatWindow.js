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
import ScheduleModal from './ScheduleModal';

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
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [wallpaper, setWallpaper] = useState('');
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showImagineHint, setShowImagineHint] = useState(false);
  const [selfDestructMode, setSelfDestructMode] = useState(false);
  const [selfDestructSeconds, setSelfDestructSeconds] = useState(30);

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const messageRefs = useRef({});
  const chatId = selectedUser?._id || selectedGroup?._id;

  const isLight = theme === 'light';

  useEffect(() => {
    setCallbacks({
      onIncomingCall: (data) => setIncomingCall(data),
      onCallEnded: () => { setActiveCall(null); setIncomingCall(null); },
    });
  }, []);

  useEffect(() => {
    if (selectedUser) { getMessages(selectedUser._id); getPinnedMessages(); }
    if (selectedGroup) { getGroupMessages(selectedGroup._id); getPinnedMessages(); joinGroup(selectedGroup._id); }
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
    if (scheduledAt) {
      alert(`✅ Message scheduled for ${new Date(scheduledAt).toLocaleString()}`);
    }
  };

  const handleImageSend = (imageData) => {
    const messageData = {
      sender: user._id,
      content: `🎨 ${imageData.prompt}`,
      type: 'image',
      fileUrl: imageData.imageUrl,
      receiver: selectedUser?._id || null,
      groupId: selectedGroup?._id || null,
    };
    sendMessage(messageData);
  };

  const handleFileUpload = (fileData) => {
    const messageData = {
      sender: user._id,
      content: fileData.originalName || 'File',
      type: fileData.type === 'image' ? 'image' : fileData.type === 'video' ? 'video' : fileData.type === 'audio' ? 'audio' : 'pdf',
      fileUrl: fileData.url,
      receiver: selectedUser?._id || null,
      groupId: selectedGroup?._id || null,
      replyTo: replyingTo?._id || null,
    };
    sendMessage(messageData);
    clearReplyingTo();
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

  const handleTranslate = async () => {
    if (!input.trim()) return;
    const result = await translateMessage(input, translateLang);
    setTranslatedMsg(result);
  };

  const handleGrammar = async () => {
    if (!input.trim()) return;
    const corrected = await correctGrammar(input);
    setInput(corrected);
  };

  const handleSummarize = async () => {
    const result = await summarizeChat(messages);
    setSummary(result);
    setShowSummary(true);
  };

  const scrollToMessage = (messageId) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-purple-400');
      setTimeout(() => el.classList.remove('ring-2', 'ring-purple-400'), 1500);
    }
  };

  const chatName = selectedUser?.name || selectedGroup?.name;
  const isGroup = !!selectedGroup;

  const bgStyle = wallpaper
    ? wallpaper.startsWith('url(')
      ? { backgroundImage: wallpaper, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: wallpaper }
    : {};

  return (
    <div
      className="chat-layout w-full h-full relative"
      style={bgStyle}
      data-theme={theme}
    >
      {/* Background overlay for wallpaper readability */}
      {wallpaper && (
        <div className="absolute inset-0 bg-black/30 pointer-events-none z-0" />
      )}

      {/* HEADER — fixed, never scrolls */}
      <div className={`chat-header relative z-10 px-4 pt-safe pt-3 pb-3 flex items-center gap-3 ${isLight ? 'bg-white/95 border-b border-gray-200' : 'bg-[#1a0a2e]/95 border-b border-white/10'} backdrop-blur-xl`}>
        <button
          onClick={onBack}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/10 hover:bg-white/20 text-white'}`}
        >
          ←
        </button>

        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => selectedUser && viewProfile(selectedUser._id)}
        >
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
                  { label: '🖼️ AI Image', action: () => { setShowImageGenerator(true); setShowHeaderMenu(false); }, color: 'text-purple-400' },
                  { label: '⏰ Schedule Message', action: () => { setShowSchedule(true); setShowHeaderMenu(false); }, color: 'text-blue-400' },
                  { label: `💣 ${selfDestructMode ? '✅ ' : ''}Self-Destruct`, action: () => { setSelfDestructMode(!selfDestructMode); setShowHeaderMenu(false); }, color: selfDestructMode ? 'text-red-400' : '' },
                  { label: '📝 Summary', action: () => { handleSummarize(); setShowHeaderMenu(false); } },
                  { label: '🔍 Search', action: () => { toggleMsgSearch(); setShowHeaderMenu(false); } },
                  { label: '📌 Pinned', action: () => { setShowPinnedBar(!showPinnedBar); setShowHeaderMenu(false); }, color: 'text-yellow-400' },
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

      {/* Self-destruct indicator */}
      {selfDestructMode && (
        <div className="relative z-10 px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
          <span className="text-red-400 text-xs font-semibold">💣 Self-Destruct Mode ON</span>
          <div className="flex items-center gap-2">
            <select
              value={selfDestructSeconds}
              onChange={(e) => setSelfDestructSeconds(Number(e.target.value))}
              className="bg-transparent text-red-400 text-xs border border-red-500/30 rounded-lg px-2 py-0.5"
            >
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
          <input
            autoFocus
            value={msgSearchQuery}
            onChange={(e) => searchMessages(e.target.value)}
            placeholder="Search messages..."
            className={`w-full px-4 py-2 rounded-full border text-sm focus:outline-none ${isLight ? 'bg-gray-100 border-gray-200 text-gray-900 focus:border-purple-400' : 'bg-white/10 border-white/20 text-white focus:border-purple-400'}`}
          />
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
          <p className="text-yellow-400 text-xs font-semibold mb-1">📌 Pinned Messages</p>
          {pinnedMessages.slice(0, 3).map((m) => (
            <div key={m._id} onClick={() => scrollToMessage(m._id)} className={`text-xs truncate cursor-pointer hover:text-yellow-300 py-0.5 ${isLight ? 'text-gray-600' : 'text-white/60'}`}>
              {m.sender?.name}: {m.content}
            </div>
          ))}
        </div>
      )}

      {/* Summary popup */}
      {showSummary && summary && (
        <div className={`absolute top-20 left-4 right-4 rounded-2xl p-4 z-40 shadow-2xl backdrop-blur border ${isLight ? 'bg-white/95 border-gray-200' : 'bg-[#1e1e30]/95 border-purple-500/30'}`}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-purple-400 font-semibold text-sm">📝 Summary</p>
            <button onClick={() => setShowSummary(false)} className={`${isLight ? 'text-gray-400' : 'text-white/40'} hover:text-purple-400`}>✕</button>
          </div>
          <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-700' : 'text-white'}`}>{summary}</p>
        </div>
      )}

      {/* Incoming call */}
      {incomingCall && !activeCall && (
        <div className="absolute top-20 left-4 right-4 bg-[#1e1e30]/95 border border-green-500/30 rounded-2xl p-4 z-40 shadow-2xl backdrop-blur">
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

      {/* MESSAGES — scrollable area */}
      <div className="chat-messages relative z-10 px-4 py-4 space-y-2">
        {loading && <div className="text-center py-4 text-white/30 text-sm">Loading...</div>}
        {messages.map((msg) => {
          const isMe = msg.sender._id === user._id || msg.sender === user._id;
          return (
            <div key={msg._id} ref={(el) => { messageRefs.current[msg._id] = el; }} className="animate-fadeIn">
              <MessageBubble msg={msg} isMe={isMe} isGroup={isGroup} onScrollToMessage={scrollToMessage} theme={theme} />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Smart replies */}
      {smartReplies.length > 0 && (
        <div className="relative z-10 px-4 pb-2 flex gap-2 overflow-x-auto chat-input">
          {smartReplies.map((reply, i) => (
            <button key={i} onClick={() => handleSend(reply)} className={`whitespace-nowrap text-xs px-3 py-2 rounded-full border transition-all flex-shrink-0 ${isLight ? 'bg-white border-gray-200 text-gray-700 hover:border-purple-400' : 'bg-white/10 border-white/20 text-white hover:border-purple-400'}`}>
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Translate preview */}
      {translatedMsg && (
        <div className={`relative z-10 mx-4 mb-2 rounded-2xl px-4 py-3 border chat-input ${isLight ? 'bg-purple-50 border-purple-200' : 'bg-white/5 border-white/10'}`}>
          <p className="text-purple-400 text-xs mb-1">🌍 {translateLang}:</p>
          <p className={`text-sm ${isLight ? 'text-gray-800' : 'text-white'}`}>{translatedMsg}</p>
          <button onClick={() => { setInput(translatedMsg); setTranslatedMsg(''); }} className="text-purple-400 text-xs mt-1 hover:underline">Use ↑</button>
        </div>
      )}

      {/* Reply bar */}
      {replyingTo && (
        <div className={`relative z-10 mx-4 mb-2 border-l-2 border-purple-400 rounded-r-2xl px-4 py-2 flex items-center justify-between chat-input ${isLight ? 'bg-purple-50' : 'bg-white/5'}`}>
          <div className="min-w-0">
            <p className="text-purple-400 text-xs font-semibold">↩️ {replyingTo.sender?.name}</p>
            <p className={`text-xs truncate ${isLight ? 'text-gray-500' : 'text-white/50'}`}>{replyingTo.content}</p>
          </div>
          <button onClick={clearReplyingTo} className="text-white/30 hover:text-white px-2">✕</button>
        </div>
      )}

      {/* /imagine hint */}
      {showImagineHint && (
        <div className="relative z-10 mx-4 mb-2 chat-input">
          <div onClick={() => { setShowImageGenerator(true); setInput(''); setShowImagineHint(false); }} className="flex items-center gap-3 bg-purple-500/20 border border-purple-500/40 rounded-2xl px-4 py-3 cursor-pointer hover:bg-purple-500/30 transition-colors">
            <span className="text-2xl">🎨</span>
            <div>
              <p className="text-purple-300 text-sm font-semibold">Open AI Image Generator</p>
              <p className="text-white/40 text-xs">Tap to create an AI image</p>
            </div>
          </div>
        </div>
      )}

      {/* INPUT AREA — fixed at bottom */}
      <div className={`chat-input relative z-10 px-4 pb-safe pb-4 pt-2 ${isLight ? 'bg-white/95 border-t border-gray-200' : 'bg-[#0f0f1a]/90 border-t border-white/5'} backdrop-blur-xl`}>
        {/* AI tools row */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 hide-scrollbar">
          {[
            { label: '✨ Grammar', action: handleGrammar },
            { label: '🌍 Translate', action: () => setShowTranslate(!showTranslate), active: showTranslate },
            { label: '🎨 /imagine', action: () => setShowImageGenerator(true), color: true },
            { label: '⏰ Schedule', action: () => setShowSchedule(true) },
            { label: `💣 ${selfDestructMode ? 'ON' : 'Destruct'}`, action: () => setSelfDestructMode(!selfDestructMode), danger: selfDestructMode },
          ].map((tool) => (
            <button
              key={tool.label}
              onClick={tool.action}
              className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-all flex-shrink-0 ${
                tool.danger ? 'border-red-500/50 text-red-400 bg-red-500/10' :
                tool.color ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' :
                tool.active ? `border-purple-400 text-purple-300 ${isLight ? 'bg-purple-50' : 'bg-purple-500/20'}` :
                isLight ? 'border-gray-200 text-gray-500 hover:border-purple-400 hover:text-purple-500' :
                'border-white/10 text-white/40 hover:border-purple-400 hover:text-white'
              }`}
            >
              {tool.label}
            </button>
          ))}
          {showTranslate && (
            <>
              <select value={translateLang} onChange={(e) => setTranslateLang(e.target.value)} className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ${isLight ? 'bg-white border-gray-200 text-gray-700' : 'bg-[#1e1e30] border-white/20 text-white'}`}>
                {['Hindi','Spanish','French','German','Japanese','Arabic','English'].map(l => <option key={l}>{l}</option>)}
              </select>
              <button onClick={handleTranslate} className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-bold flex-shrink-0">Go</button>
            </>
          )}
        </div>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="mb-2">
            <EmojiPicker onSelect={(emoji) => { setInput(p => p + emoji); setShowEmojiPicker(false); }} onClose={() => setShowEmojiPicker(false)} />
          </div>
        )}

        {/* Main input row */}
        <div className="flex items-end gap-2">
          <div className={`flex-1 rounded-3xl px-4 py-3 flex items-end gap-2 transition-colors border ${isLight ? 'bg-gray-100 border-gray-200 focus-within:border-purple-400' : 'bg-white/5 border-white/10 focus-within:border-purple-400/50'}`}>
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-xl pb-0.5 flex-shrink-0 transition-colors hover:scale-110">😊</button>
            <textarea
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder={selfDestructMode ? '💣 This message will self-destruct...' : 'Message...'}
              rows={1}
              style={{ resize: 'none', maxHeight: '100px' }}
              className={`flex-1 bg-transparent text-sm focus:outline-none leading-relaxed ${isLight ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-white/30'}`}
            />
            <button onClick={() => setShowFileUpload(true)} className="text-xl pb-0.5 flex-shrink-0 transition-colors hover:scale-110">📎</button>
            <button onClick={() => setShowVoiceRecorder(true)} className="text-xl pb-0.5 flex-shrink-0 transition-colors hover:scale-110">🎤</button>
          </div>
          <button
            onClick={() => handleSend()}
            className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/25 flex-shrink-0"
          >
            <span className="text-white font-bold text-lg">➤</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showFileUpload && <FileUpload onUpload={handleFileUpload} onClose={() => setShowFileUpload(false)} />}
      {showVoiceRecorder && <VoiceRecorder onUpload={handleFileUpload} onClose={() => setShowVoiceRecorder(false)} />}
      {viewingProfile && <ProfileModal viewingUser={viewingProfile} onClose={closeProfile} />}
      {showWallpaperPicker && <WallpaperPicker chatId={chatId} currentWallpaper={wallpaper} onSelect={(url) => { setWallpaper(url); setShowWallpaperPicker(false); }} onClose={() => setShowWallpaperPicker(false)} />}
      {showImageGenerator && <ImageGeneratorModal onSend={handleImageSend} onClose={() => setShowImageGenerator(false)} />}
      {showSchedule && <ScheduleModal onSchedule={(date) => { handleSend(input, date); setShowSchedule(false); }} onClose={() => setShowSchedule(false)} />}
      {showBlockConfirm && <ConfirmModal title={`Block ${selectedUser?.name}?`} message="They won't be able to message you anymore." confirmText="Block" danger onConfirm={async () => { await blockUser(selectedUser._id); setShowBlockConfirm(false); }} onCancel={() => setShowBlockConfirm(false)} />}
      {activeCall && selectedUser && <VideoCall socket={socket} currentUser={user} selectedUser={selectedUser} onClose={() => setActiveCall(null)} isIncoming={activeCall.isIncoming} incomingSignal={activeCall.signal} isVoiceOnly={activeCall.type === 'voice'} />}
    </div>
  );
}