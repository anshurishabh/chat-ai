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
    typingUsers, loading, onlineUsers, contacts, getContacts,
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

  // Message Forwarding and Tags States UI Layer
  const [forwardingMsg, setForwardingMsg] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState(''); // Label State UI

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const messageRefs = useRef({});
  const audioNotificationRef = useRef(null);
  
  const chatId = selectedUser?._id || selectedGroup?._id || '';
  const isLight = theme === 'light';

  useEffect(() => {
    // Standard initialization of notification sound asset link layer
    audioNotificationRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2357/2357-84.wav');
    
    setCallbacks({
      onIncomingCall: (data) => setIncomingCall(data),
      onCallEnded: () => { setActiveCall(null); setIncomingCall(null); },
      onReceiveMessage: () => {
        // Play notification tone stream on safe message capture loops
        audioNotificationRef.current?.play().catch(e => console.log("Audio trigger ignored until interaction."));
      }
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
    showHeaderMenu && setShowHeaderMenu(false);
    setInput('');
    setSelfDestructMode(false);
    setSelectedLabel('');
  }, [selectedUser, selectedGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text, customLabel) => {
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
      replyTo: replyTo?._id || null,
      isSelfDestruct: selfDestructMode,
      selfDestructSeconds: selfDestructMode ? selfDestructSeconds : null,
      label: customLabel || selectedLabel || null // Save message tag label context parameters node
    });
    setInput('');
    setSelectedLabel('');
    clearSmartReplies();
    clearReplyingTo();
  };

  // Execution algorithm handler for payload forwarding
  const executeForward = async (targetContactId) => {
    if (!forwardingMsg) return;
    await sendMessage({
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
                  { label: '¼ Summary', action: async () => { const s = await summarizeChat(messages); setSummary(s); setShowSummary(true); setShowHeaderMenu(false); } },
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

      {/* MESSAGES CORE VIEWPORTS PANEL */}
      <div className="chat-messages relative z-10 px-4 py-4 space-y-2">
        {loading && <div className="text-center py-4 text-white/30 text-sm">Loading...</div>}
        {messages.map((msg) => {
          const isMe = msg.sender._id === user._id || msg.sender === user._id;
          return (
            <div key={msg._id} ref={(el) => { messageRefs.current[msg._id] = el; }}>
              <MessageBubble msg={msg} isMe={isMe} isGroup={isGroup} onScrollToMessage={scrollToMessage} theme={theme} onForward={(m) => setForwardingMsg(m)} />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* MESSAGE FORWARDING UI SELECTOR MODAL OVERLAY */}
      {forwardingMsg && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#111120] border border-white/10 w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-sm">↩️ Forward Message To:</h3>
              <button onClick={() => setForwardingMsg(null)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-white/40 mb-3 bg-white/5 p-2 rounded-xl border border-white/5 truncate">"{forwardingMsg.content}"</p>
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {contacts.map((contact) => (
                <div key={contact._id} className="flex justify-between items-center p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-purple-500/10 transition-colors">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">{contact.name?.charAt(0)}</div>
                    <span className="text-white text-xs truncate">{contact.name}</span>
                  </div>
                  <button onClick={() => executeForward(contact._id)} className="bg-purple-500 hover:bg-purple-400 text-white text-[10px] px-3 py-1 rounded-lg font-bold transition-all">Send</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INPUT ACTIONS AND LABEL/TAGS SELECTION BAR */}
      <div className={`chat-input relative z-10 px-4 pb-8 pt-2 backdrop-blur-xl border-t ${isLight ? 'bg-white/95 border-gray-200' : 'bg-[#0f0f1a]/90 border-white/5'}`}>
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 items-center">
          <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider flex-shrink-0">Labels:</span>
          {['Work', 'Urgent', 'Personal', 'Important'].map((labelName) => (
            <button
              key={labelName}
              onClick={() => setSelectedLabel(selectedLabel === labelName ? '' : labelName)}
              className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition-all border ${
                selectedLabel === labelName 
                  ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-500/20' 
                  : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
              }`}
            >
              🏷️ {labelName}
            </button>
          ))}
          
          <div className="h-4 w-px bg-white/10 mx-1 flex-shrink-0" />

          {[
            { label: '✨ Grammar', action: async () => { if (!input.trim()) return; const c = await correctGrammar(input); setInput(c); } },
            { label: '🌍 Translate', action: () => setShowTranslate(!showTranslate), active: showTranslate },
            { label: '🎨 /imagine', action: () => setShowImageGenerator(true), color: true },
          ].map((tool) => (
            <button key={tool.label} onClick={tool.action} className={`whitespace-nowrap text-[10px] px-3 py-1 rounded-full border flex-shrink-0 ${
              tool.color ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' :
              tool.active ? 'border-purple-400 text-purple-300 bg-purple-500/20' :
              isLight ? 'border-gray-200 text-gray-500 hover:border-purple-400' : 'border-white/10 text-white/40 hover:border-purple-400 hover:text-white'
            }`}>
              {tool.label}
            </button>
          ))}
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
              placeholder={selectedLabel ? `Message with [${selectedLabel}] tag...` : "Message..."}
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