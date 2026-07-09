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
    selectedUser, selectedGroup, messages, getMessages, getGroupMessages,
    typingUsers, loading, onlineUsers,
    replyingTo, clearReplyingTo,
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
    if (selectedUser) { getMessages(selectedUser._id); getPinnedMessages(); }
    if (selectedGroup) { getGroupMessages(selectedGroup._id); getPinnedMessages(); joinGroup(selectedGroup._id); }
    clearSmartReplies();
    clearReplyingTo();
    setSummary('');
    setShowSummary(false);
    setShowPinnedBar(false);
    setShowHeaderMenu(false);
    setInput('');
    setSelfDestructMode(false);
  }, [selectedUser, selectedGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text) => {
    const content = text || input;
    if (!content.trim()) return;

    if (content.trim().startsWith('/imagine')) {
      setInput('');
      setShowImageGenerator(true);
      return;
    }

    sendMessage({
      sender: user._id,
      content,
      type: 'text',
      receiver: selectedUser?._id || null,
      groupId: selectedGroup?._id || null,
      replyTo: replyingTo?._id || null,
      isSelfDestruct: selfDestructMode,
      selfDestructSeconds: selfDestructMode ? selfDestructSeconds : null,
    });
    setInput('');
    clearSmartReplies();
    clearReplyingTo();
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

      {/* HEADER */}
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
                  { label: '📝 Summary', action: async () => { const s = await summarizeChat(messages); setSummary(s); setShowSummary(true); setShowHeaderMenu(false); } },
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

      {/* Self destruct bar */}
      {selfDestructMode && (
        <div className="relative z-10 px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
          <span className="text-red-400 text-xs font-semibold">💣 Self-Destruct ON</span>
          <div className="flex items-center gap-2">
            <select value={selfDestructSeconds} onChange={(e) => setSelfDestructSeconds(Number(e.target.value))} className="bg-transparent text-red-400 text-xs border border-red-500/30 rounded-lg px-2 py-0.5">
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1min</option>
              <option value={300}>5min</option>
            </select>
            <button onClick={() => setSelfDestructMode(false)} className="text-red-400 text-xs hover:underline">Off</button>
          </div>
        </div>
      )}

      {/* Search */}
      {showMsgSearch && (
        <div className={`relative z-10 px-4 py-2 border-b ${isLight ? 'bg-white/95 border-gray-200' : 'bg-[#1a0a2e]/80 border-white/10'}`}>
          <input autoFocus value={msgSearchQuery} onChange={(e) => searchMessages(e.target.value)} placeholder="Search messages..." className={`w-full px-4 py-2 rounded-full border text-sm focus:outline-none ${isLight ? 'bg-gray-100 border-gray-200 text-gray-900' : 'bg-white/10 border-white/20 text-white'}`} />
          {msgSearchResults.length > 0 && (
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

      {/* Pinned */}
      {showPinnedBar && pinnedMessages.length > 0 && (
        <div className="relative z-10 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
          <p className="text-yellow-400 text-xs font-semibold mb-1">📌 Pinned</p>
          {pinnedMessages.slice(0, 2).map((m) => (
            <div key={m._id} onClick={() => scrollToMessage(m._id)} className="text-xs truncate cursor-pointer text-white/60 hover:text-white py-0.5">
              {m.sender?.name}: {m.content}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {showSummary && summary && (
        <div className={`absolute top-24 left-4 right-4 rounded-2xl p-4 z-40 shadow-2xl border ${isLight ? 'bg-white/95 border-gray-200' : 'bg-[#1e1e30]/95 border-purple-500/30'}`}>
          <div className="flex justify-between mb-2">
            <p className="text-purple-400 font-semibold text-sm">📝 Summary</p>
            <button onClick={() => setShowSummary(false)} className="text-white/40 hover:text-white">✕</button>
          </div>
          <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-700' : 'text-white'}`}>{summary}</p>
        </div>
      )}

      {/* Incoming call */}
      {incomingCall && !activeCall && (
        <div className="absolute top-24 left-4 right-4 bg-[#1e1e30]/95 border border-green-500/30 rounded-2xl p-4 z-40 shadow-2xl">
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
              <button onClick={() => setIncomingCall(null)} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-2xl">📵</button>
              <button onClick={() => { setActiveCall({ type: incomingCall.isVoiceOnly ? 'voice' : 'video', isIncoming: true, signal: incomingCall.signal }); setIncomingCall(null); }} className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-2xl animate-bounce">📞</button>
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
            <div key={msg._id} ref={(el) => { messageRefs.current[msg._id] = el; }}>
              <MessageBubble msg={msg} isMe={isMe} isGroup={isGroup} onScrollToMessage={scrollToMessage} theme={theme} />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Smart replies */}
      {smartReplies.length > 0 && (
        <div className="relative z-10 px-4 pb-2 flex gap-2 overflow-x-auto">
          {smartReplies.map((reply, i) => (
            <button key={i} onClick={() => handleSend(reply)} className={`whitespace-nowrap text-xs px-3 py-2 rounded-full border flex-shrink-0 ${isLight ? 'bg-white border-gray-200 text-gray-700' : 'bg-white/10 border-white/20 text-white'}`}>
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

      {/* INPUT */}
      <div className={`chat-input relative z-10 px-4 pb-8 pt-2 backdrop-blur-xl border-t ${isLight ? 'bg-white/95 border-gray-200' : 'bg-[#0f0f1a]/90 border-white/5'}`}>
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
          {[
            { label: '✨ Grammar', action: async () => { if (!input.trim()) return; const c = await correctGrammar(input); setInput(c); } },
            { label: '🌍 Translate', action: () => setShowTranslate(!showTranslate), active: showTranslate },
            { label: '🎨 /imagine', action: () => setShowImageGenerator(true), color: true },
            { label: `💣 ${selfDestructMode ? 'ON' : 'Destruct'}`, action: () => setSelfDestructMode(!selfDestructMode), danger: selfDestructMode },
          ].map((tool) => (
            <button key={tool.label} onClick={tool.action} className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border flex-shrink-0 ${
              tool.danger ? 'border-red-500/50 text-red-400 bg-red-500/10' :
              tool.color ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' :
              tool.active ? 'border-purple-400 text-purple-300 bg-purple-500/20' :
              isLight ? 'border-gray-200 text-gray-500 hover:border-purple-400' :
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

        {showEmojiPicker && (
          <div className="relative">
            <EmojiPicker onSelect={(emoji) => { setInput(p => p + emoji); setShowEmojiPicker(false); }} onClose={() => setShowEmojiPicker(false)} />
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className={`flex-1 rounded-3xl px-4 py-3 flex items-end gap-2 border ${isLight ? 'bg-gray-100 border-gray-200 focus-within:border-purple-400' : 'bg-white/5 border-white/10 focus-within:border-purple-400/50'}`}>
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-xl pb-0.5 flex-shrink-0 hover:scale-110 transition-transform">😊</button>
            <textarea
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              style={{ resize: 'none', maxHeight: '100px' }}
              className={`flex-1 bg-transparent text-sm focus:outline-none leading-relaxed ${isLight ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-white/30'}`}
            />
            <button onClick={() => setShowFileUpload(true)} className="text-xl pb-0.5 flex-shrink-0 hover:scale-110 transition-transform">📎</button>
            <button onClick={() => setShowVoiceRecorder(true)} className="text-xl pb-0.5 flex-shrink-0 hover:scale-110 transition-transform">🎤</button>
          </div>
          <button onClick={() => handleSend()} className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25 flex-shrink-0">
            <span className="text-white font-bold text-lg">➤</span>
          </button>
        </div>
      </div>

      {showFileUpload && <FileUpload onUpload={handleFileUpload} onClose={() => setShowFileUpload(false)} />}
      {showVoiceRecorder && <VoiceRecorder onUpload={handleFileUpload} onClose={() => setShowVoiceRecorder(false)} />}
      {viewingProfile && <ProfileModal viewingUser={viewingProfile} onClose={closeProfile} />}
      {showWallpaperPicker && <WallpaperPicker chatId={chatId} currentWallpaper={wallpaper} onSelect={(url) => { setWallpaper(url); setShowWallpaperPicker(false); }} onClose={() => setShowWallpaperPicker(false)} />}
      {showImageGenerator && <ImageGeneratorModal onSend={handleImageSend} onClose={() => setShowImageGenerator(false)} />}
      {showBlockConfirm && <ConfirmModal title={`Block ${selectedUser?.name}?`} message="They won't be able to message you." confirmText="Block" danger onConfirm={async () => { await blockUser(selectedUser._id); setShowBlockConfirm(false); }} onCancel={() => setShowBlockConfirm(false)} />}
      {activeCall && selectedUser && <VideoCall socket={socket} currentUser={user} selectedUser={selectedUser} onClose={() => setActiveCall(null)} isIncoming={activeCall.isIncoming} incomingSignal={activeCall.signal} isVoiceOnly={activeCall.type === 'voice'} />}
    </div>
  );
}