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
  const { user } = useAuthStore();
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
  const [showImagineHint, setShowImagineHint] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const messageRefs = useRef({});
  const chatId = selectedUser?._id || selectedGroup?._id;

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
    };

    sendMessage(messageData);
    setInput('');
    clearSmartReplies();
    clearReplyingTo();
    setShowImagineHint(false);
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
    setShowImagineHint(value.startsWith('/imagine') || value === '/ima');

    if (selectedUser) {
      sendTyping({ sender: user._id, receiver: selectedUser._id });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        stopTyping({ sender: user._id, receiver: selectedUser._id });
      }, 1500);
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

  return (
    <div
      className="flex-1 h-full flex flex-col relative overflow-hidden"
      style={wallpaper ? { background: wallpaper } : { background: 'linear-gradient(180deg, #0f0f1a 0%, #0a0a14 100%)' }}
    >
      {/* Header */}
      <div className="px-4 pt-12 pb-3 bg-gradient-to-b from-[#1a0a2e]/95 to-transparent backdrop-blur-md flex items-center gap-3 relative z-10">

        {/* Back button — always visible */}
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0"
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
              : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                  {chatName?.charAt(0).toUpperCase()}
                </div>
              )
            }
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{chatName}</p>
            {typingUsers.length > 0 ? (
              <p className="text-green-400 text-xs animate-pulse">typing...</p>
            ) : (
              <p className="text-white/40 text-xs">
                {selectedUser
                  ? (onlineUsers?.includes(selectedUser._id) ? '🟢 online' : 'offline')
                  : `${selectedGroup?.members?.length} members`}
              </p>
            )}
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedUser && (
            <>
              <button onClick={() => setActiveCall({ type: 'voice', isIncoming: false })} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">📞</button>
              <button onClick={() => setActiveCall({ type: 'video', isIncoming: false })} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">📹</button>
            </>
          )}
          <div className="relative">
            <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 text-xl transition-colors">⋮</button>
            {showHeaderMenu && (
              <div className="absolute right-0 top-11 w-52 bg-[#1e1e30] border border-white/10 rounded-2xl shadow-2xl z-30 overflow-hidden">
                {selectedUser && <button onClick={() => { viewProfile(selectedUser._id); setShowHeaderMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5">👤 View Profile</button>}
                <button onClick={() => { setShowWallpaperPicker(true); setShowHeaderMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5">🎨 Wallpaper</button>
                <button onClick={() => { setShowImageGenerator(true); setShowHeaderMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-purple-400 hover:bg-white/5">🖼️ AI Image</button>
                <button onClick={() => { handleSummarize(); setShowHeaderMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5">📝 Summary</button>
                <button onClick={() => { toggleMsgSearch(); setShowHeaderMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5">🔍 Search</button>
                <button onClick={() => { setShowPinnedBar(!showPinnedBar); setShowHeaderMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-yellow-400 hover:bg-white/5">📌 Pinned</button>
                {selectedUser && <button onClick={() => { setShowBlockConfirm(true); setShowHeaderMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5">🚫 Block</button>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      {showMsgSearch && (
        <div className="px-4 py-2 bg-[#1a0a2e]/80 backdrop-blur border-b border-white/10">
          <input
            autoFocus
            value={msgSearchQuery}
            onChange={(e) => searchMessages(e.target.value)}
            placeholder="Search messages..."
            className="w-full bg-white/10 text-white px-4 py-2 rounded-full border border-white/20 focus:border-purple-400 text-sm focus:outline-none"
          />
          {msgSearchQuery && msgSearchResults.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {msgSearchResults.map((m) => (
                <div key={m._id} onClick={() => { scrollToMessage(m._id); toggleMsgSearch(); }} className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer">
                  <p className="text-purple-400 text-xs font-semibold">{m.sender?.name}</p>
                  <p className="text-white text-xs truncate">{m.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pinned bar */}
      {showPinnedBar && pinnedMessages.length > 0 && (
        <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 backdrop-blur">
          <p className="text-yellow-400 text-xs font-semibold mb-1">📌 Pinned</p>
          {pinnedMessages.slice(0, 3).map((m) => (
            <div key={m._id} onClick={() => scrollToMessage(m._id)} className="text-white/70 text-xs truncate cursor-pointer hover:text-white py-0.5">
              {m.sender?.name}: {m.content}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {showSummary && summary && (
        <div className="absolute top-24 left-4 right-4 bg-[#1e1e30]/95 border border-purple-500/30 rounded-2xl p-4 z-40 shadow-2xl backdrop-blur">
          <div className="flex justify-between items-center mb-2">
            <p className="text-purple-400 font-semibold text-sm">📝 Summary</p>
            <button onClick={() => setShowSummary(false)} className="text-white/40 hover:text-white">✕</button>
          </div>
          <p className="text-white text-sm leading-relaxed">{summary}</p>
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
              <button onClick={() => { setActiveCall({ type: incomingCall.isVoiceOnly ? 'voice' : 'video', isIncoming: true, signal: incomingCall.signal }); setIncomingCall(null); }} className="w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center text-2xl animate-bounce">📞</button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading && <div className="text-center text-white/30 text-sm py-4">Loading...</div>}
        {messages.map((msg) => {
          const isMe = msg.sender._id === user._id || msg.sender === user._id;
          return (
            <div key={msg._id} ref={(el) => { messageRefs.current[msg._id] = el; }}>
              <MessageBubble msg={msg} isMe={isMe} isGroup={isGroup} onScrollToMessage={scrollToMessage} />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Smart replies */}
      {smartReplies.length > 0 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {smartReplies.map((reply, i) => (
            <button key={i} onClick={() => handleSend(reply)} className="whitespace-nowrap bg-white/10 hover:bg-purple-500/30 text-white text-xs px-3 py-2 rounded-full border border-white/20 hover:border-purple-400 transition-all flex-shrink-0">
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Translate preview */}
      {translatedMsg && (
        <div className="mx-4 mb-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
          <p className="text-purple-400 text-xs mb-1">🌍 {translateLang}:</p>
          <p className="text-white text-sm">{translatedMsg}</p>
          <button onClick={() => { setInput(translatedMsg); setTranslatedMsg(''); }} className="text-purple-400 text-xs mt-1 hover:underline">Use this ↑</button>
        </div>
      )}

      {/* Reply bar */}
      {replyingTo && (
        <div className="mx-4 mb-2 bg-white/5 border-l-2 border-purple-400 rounded-r-2xl px-4 py-2 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-purple-400 text-xs font-semibold">Replying to {replyingTo.sender?.name}</p>
            <p className="text-white/50 text-xs truncate">{replyingTo.content}</p>
          </div>
          <button onClick={clearReplyingTo} className="text-white/30 hover:text-white px-2">✕</button>
        </div>
      )}

      {/* /imagine hint */}
      {showImagineHint && (
        <div className="mx-4 mb-2">
          <div onClick={() => { setShowImageGenerator(true); setInput(''); setShowImagineHint(false); }} className="flex items-center gap-3 bg-purple-500/20 border border-purple-500/40 rounded-2xl px-4 py-3 cursor-pointer hover:bg-purple-500/30 transition-colors">
            <span className="text-2xl">🎨</span>
            <div>
              <p className="text-purple-300 text-sm font-semibold">AI Image Generator</p>
              <p className="text-white/40 text-xs">Tap to open and create an AI image</p>
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 pb-8 pt-2 bg-gradient-to-t from-[#0f0f1a] to-transparent">
        {/* AI tools row */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
          <button onClick={handleGrammar} className="text-white/40 hover:text-white text-xs border border-white/10 hover:border-purple-400 px-3 py-1 rounded-full transition-all whitespace-nowrap flex-shrink-0">✨ Grammar</button>
          <button onClick={() => setShowTranslate(!showTranslate)} className="text-white/40 hover:text-white text-xs border border-white/10 hover:border-purple-400 px-3 py-1 rounded-full transition-all whitespace-nowrap flex-shrink-0">🌍 Translate</button>
          <button onClick={() => setShowImageGenerator(true)} className="text-purple-400 hover:text-purple-300 text-xs border border-purple-500/30 hover:border-purple-400 px-3 py-1 rounded-full transition-all whitespace-nowrap flex-shrink-0">🎨 /imagine</button>
          {showTranslate && (
            <>
              <select value={translateLang} onChange={(e) => setTranslateLang(e.target.value)} className="bg-[#1e1e30] text-white text-xs px-2 py-1 rounded-full border border-white/20 flex-shrink-0">
                <option>Hindi</option><option>Spanish</option><option>French</option>
                <option>German</option><option>Japanese</option><option>Arabic</option><option>English</option>
              </select>
              <button onClick={handleTranslate} className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-bold flex-shrink-0">Go</button>
            </>
          )}
        </div>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="relative">
            <EmojiPicker onSelect={(emoji) => { setInput(p => p + emoji); setShowEmojiPicker(false); }} onClose={() => setShowEmojiPicker(false)} />
          </div>
        )}

        {/* Main input */}
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 focus-within:border-purple-400/50 rounded-3xl px-4 py-3 flex items-end gap-2 transition-colors">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-white/30 hover:text-yellow-400 text-xl transition-colors flex-shrink-0 pb-0.5">😊</button>
            <textarea
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              style={{ resize: 'none', maxHeight: '120px' }}
              className="flex-1 bg-transparent text-white text-sm placeholder-white/30 focus:outline-none leading-relaxed"
            />
            <button onClick={() => setShowFileUpload(true)} className="text-white/30 hover:text-purple-400 text-xl transition-colors flex-shrink-0 pb-0.5">📎</button>
            <button onClick={() => setShowVoiceRecorder(true)} className="text-white/30 hover:text-purple-400 text-xl transition-colors flex-shrink-0 pb-0.5">🎤</button>
          </div>
          <button
            onClick={() => handleSend()}
            className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/30 flex-shrink-0"
          >
            <span className="text-white font-bold">➤</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showFileUpload && <FileUpload onUpload={handleFileUpload} onClose={() => setShowFileUpload(false)} />}
      {showVoiceRecorder && <VoiceRecorder onUpload={handleFileUpload} onClose={() => setShowVoiceRecorder(false)} />}
      {viewingProfile && <ProfileModal viewingUser={viewingProfile} onClose={closeProfile} />}
      {showWallpaperPicker && (
        <WallpaperPicker
          chatId={chatId}
          currentWallpaper={wallpaper}
          onSelect={(url) => { setWallpaper(url); setShowWallpaperPicker(false); }}
          onClose={() => setShowWallpaperPicker(false)}
        />
      )}
      {showImageGenerator && <ImageGeneratorModal onSend={handleImageSend} onClose={() => setShowImageGenerator(false)} />}
      {showBlockConfirm && (
        <ConfirmModal
          title={`Block ${selectedUser?.name}?`}
          message="They won't be able to message you anymore."
          confirmText="Block"
          danger
          onConfirm={async () => { await blockUser(selectedUser._id); setShowBlockConfirm(false); }}
          onCancel={() => setShowBlockConfirm(false)}
        />
      )}
      {activeCall && selectedUser && (
        <VideoCall
          socket={socket}
          currentUser={user}
          selectedUser={selectedUser}
          onClose={() => setActiveCall(null)}
          isIncoming={activeCall.isIncoming}
          incomingSignal={activeCall.signal}
          isVoiceOnly={activeCall.type === 'voice'}
        />
      )}
    </div>
  );
}