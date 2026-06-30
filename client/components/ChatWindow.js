'use client';
import { useEffect, useRef, useState } from 'react';
import useChatStore from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';
import useAIStore from '../store/useAIStore';
import useSocket from '../hooks/useSocket';
import AIAssistant from './AIAssistant';
import FileUpload from './FileUpload';
import VoiceRecorder from './VoiceRecorder';
import VideoCall from './VideoCall';
import MessageBubble from './MessageBubble';

export default function ChatWindow() {
  const { user } = useAuthStore();
  const {
    selectedUser, selectedGroup, messages, getMessages, getGroupMessages,
    typingUsers, loading, onlineUsers,
    replyingTo, clearReplyingTo,
    pinnedMessages, getPinnedMessages,
    showSearch, toggleSearch, searchQuery, searchResults, searchMessages,
  } = useChatStore();
  const { sendMessage, sendTyping, stopTyping, joinGroup, setCallbacks, socket } = useSocket();
  const { smartReplies, clearSmartReplies, translateMessage, summarizeChat, correctGrammar } = useAIStore();

  const [input, setInput] = useState('');
  const [showAI, setShowAI] = useState(false);
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

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const messageRefs = useRef({});

  useEffect(() => {
    setCallbacks({
      onIncomingCall: (data) => setIncomingCall(data),
      onCallEnded: () => {
        setActiveCall(null);
        setIncomingCall(null);
      },
    });
  }, []);

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
    setSummary('');
    setShowSummary(false);
    setShowPinnedBar(false);
  }, [selectedUser, selectedGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text) => {
    const content = text || input;
    if (!content.trim()) return;

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
    setInput(e.target.value);
    if (selectedUser) {
      sendTyping({ sender: user._id, receiver: selectedUser._id });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        stopTyping({ sender: user._id, receiver: selectedUser._id });
      }, 1500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape' && replyingTo) {
      clearReplyingTo();
    }
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

  const startVideoCall = () => {
    if (!selectedUser) return;
    setActiveCall({ type: 'video', isIncoming: false });
  };

  const startVoiceCall = () => {
    if (!selectedUser) return;
    setActiveCall({ type: 'voice', isIncoming: false });
  };

  const scrollToMessage = (messageId) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-green-400');
      setTimeout(() => el.classList.remove('ring-2', 'ring-green-400'), 1500);
    }
  };

  if (!selectedUser && !selectedGroup) {
    return (
      <div className="flex-1 h-screen bg-gray-950 flex flex-col items-center justify-center">
        <div className="text-8xl mb-6 animate-bounce">💬</div>
        <h2 className="text-white text-3xl font-bold mb-3">Welcome to NexChat</h2>
        <p className="text-gray-400 mb-8">Select a user or group to start chatting</p>
        <button
          onClick={() => setShowAI(true)}
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-black font-bold px-8 py-4 rounded-full transition-all transform hover:scale-105"
        >
          🤖 Chat with AI Assistant
        </button>
        {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
      </div>
    );
  }

  const chatName = selectedUser?.name || selectedGroup?.name;
  const isGroup = !!selectedGroup;

  return (
    <div className="flex-1 h-screen bg-gray-950 flex flex-col relative">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {chatName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold">{chatName}</p>
            {typingUsers.length > 0 ? (
              <p className="text-green-400 text-xs animate-pulse">✍️ typing...</p>
            ) : (
              <p className="text-gray-400 text-xs">
                {selectedUser
                  ? (onlineUsers?.includes(selectedUser._id) ? '🟢 Online' : '⚫ Offline')
                  : `👥 ${selectedGroup?.members?.length} members`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedUser && (
            <>
              <button onClick={startVoiceCall} className="w-9 h-9 bg-gray-800 hover:bg-green-500 rounded-full flex items-center justify-center text-gray-400 hover:text-black transition-all" title="Voice Call">
                📞
              </button>
              <button onClick={startVideoCall} className="w-9 h-9 bg-gray-800 hover:bg-blue-500 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all" title="Video Call">
                📹
              </button>
            </>
          )}
          <button
            onClick={toggleSearch}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${showSearch ? 'bg-green-500 text-black' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}
            title="Search messages"
          >
            🔍
          </button>
          <button
            onClick={() => setShowPinnedBar(!showPinnedBar)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all relative ${showPinnedBar ? 'bg-yellow-500 text-black' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}
            title="Pinned messages"
          >
            📌
            {pinnedMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                {pinnedMessages.length}
              </span>
            )}
          </button>
          <button onClick={handleSummarize} className="text-gray-400 hover:text-green-400 text-xs border border-gray-700 px-3 py-1 rounded-full transition-colors">
            📝 Summary
          </button>
          <button onClick={() => setShowAI(!showAI)} className="text-gray-400 hover:text-green-400 text-xs border border-gray-700 px-3 py-1 rounded-full transition-colors">
            🤖 AI
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="bg-gray-900 border-b border-gray-800 p-3">
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => searchMessages(e.target.value)}
            placeholder="Search in this conversation..."
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-full border border-gray-700 focus:outline-none focus:border-green-400 text-sm"
          />
          {searchQuery && (
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {searchResults.length === 0 && (
                <p className="text-gray-500 text-xs px-2">No messages found</p>
              )}
              {searchResults.map((m) => (
                <div
                  key={m._id}
                  onClick={() => { scrollToMessage(m._id); toggleSearch(); }}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer"
                >
                  <p className="text-green-400 text-xs font-semibold">{m.sender?.name}</p>
                  <p className="text-white text-xs truncate">{m.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pinned messages bar */}
      {showPinnedBar && (
        <div className="bg-gray-900 border-b border-gray-800 p-3 max-h-40 overflow-y-auto">
          <p className="text-yellow-400 text-xs font-semibold mb-2">📌 Pinned Messages</p>
          {pinnedMessages.length === 0 && (
            <p className="text-gray-500 text-xs">No pinned messages yet</p>
          )}
          {pinnedMessages.map((m) => (
            <div
              key={m._id}
              onClick={() => { scrollToMessage(m._id); setShowPinnedBar(false); }}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer mb-1"
            >
              <p className="text-green-400 text-xs font-semibold">{m.sender?.name}</p>
              <p className="text-white text-xs truncate">{m.type === 'text' ? m.content : '📎 Attachment'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && summary && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-96 bg-gray-800 border border-green-500 rounded-xl p-4 z-40 shadow-2xl">
          <div className="flex justify-between items-center mb-3">
            <p className="text-green-400 font-semibold text-sm">📝 Chat Summary</p>
            <button onClick={() => setShowSummary(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <p className="text-white text-sm leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Incoming Call Banner */}
      {incomingCall && !activeCall && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-96 bg-gray-800 border border-green-500 rounded-xl p-4 z-40 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold animate-pulse">
                {incomingCall.callerName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{incomingCall.callerName}</p>
                <p className="text-gray-400 text-xs">Incoming {incomingCall.isVoiceOnly ? 'voice' : 'video'} call...</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIncomingCall(null)} className="w-10 h-10 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-xl">📵</button>
              <button
                onClick={() => {
                  setActiveCall({ type: incomingCall.isVoiceOnly ? 'voice' : 'video', isIncoming: true, signal: incomingCall.signal });
                  setIncomingCall(null);
                }}
                className="w-10 h-10 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center text-xl animate-bounce"
              >
                📞
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <div className="text-center text-gray-400 text-sm">Loading messages...</div>}
        {messages.map((msg) => {
          const isMe = msg.sender._id === user._id || msg.sender === user._id;
          return (
            <div
              key={msg._id}
              ref={(el) => { messageRefs.current[msg._id] = el; }}
              className="rounded-2xl transition-all"
            >
              <MessageBubble
                msg={msg}
                isMe={isMe}
                isGroup={isGroup}
                onScrollToMessage={scrollToMessage}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Smart Replies */}
      {smartReplies.length > 0 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-gray-800">
          {smartReplies.map((reply, i) => (
            <button key={i} onClick={() => handleSend(reply)} className="whitespace-nowrap bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-2 rounded-full border border-gray-600 hover:border-green-400 transition-colors">
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Translate Preview */}
      {translatedMsg && (
        <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
          <p className="text-green-400 text-xs mb-1">🌍 Translation ({translateLang}):</p>
          <p className="text-white text-sm">{translatedMsg}</p>
          <button onClick={() => { setInput(translatedMsg); setTranslatedMsg(''); }} className="text-green-400 text-xs mt-1 hover:underline">Use this ↑</button>
        </div>
      )}

      {/* Reply preview bar */}
      {replyingTo && (
        <div className="px-4 pt-3 bg-gray-900 border-t border-gray-800 flex items-center justify-between">
          <div className="flex-1 min-w-0 border-l-2 border-green-400 pl-3 py-1">
            <p className="text-green-400 text-xs font-semibold">Replying to {replyingTo.sender?.name}</p>
            <p className="text-gray-400 text-xs truncate">
              {replyingTo.type === 'text' ? replyingTo.content : '📎 Attachment'}
            </p>
          </div>
          <button onClick={clearReplyingTo} className="text-gray-400 hover:text-white px-3">✕</button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="flex gap-2 mb-3 flex-wrap">
          <button onClick={handleGrammar} className="text-gray-400 hover:text-green-400 text-xs border border-gray-700 px-2 py-1 rounded-full transition-colors">
            ✨ Fix Grammar
          </button>
          <button onClick={() => setShowTranslate(!showTranslate)} className="text-gray-400 hover:text-green-400 text-xs border border-gray-700 px-2 py-1 rounded-full transition-colors">
            🌍 Translate
          </button>
          {showTranslate && (
            <>
              <select value={translateLang} onChange={(e) => setTranslateLang(e.target.value)} className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600">
                <option>Hindi</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Japanese</option>
                <option>Arabic</option>
                <option>English</option>
              </select>
              <button onClick={handleTranslate} className="bg-green-500 text-black text-xs px-2 py-1 rounded font-bold">Go</button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowFileUpload(true)} className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-green-400 transition-colors flex-shrink-0">
            📎
          </button>
          <button onClick={() => setShowVoiceRecorder(true)} className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-green-400 transition-colors flex-shrink-0">
            🎤
          </button>
          <input
            type="text"
            value={input}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder={replyingTo ? 'Type your reply...' : 'Type a message...'}
            className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-full border border-gray-700 focus:outline-none focus:border-green-400 text-sm transition-colors"
          />
          <button onClick={() => handleSend()} className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 rounded-full flex items-center justify-center transition-all transform hover:scale-105 flex-shrink-0">
            <span className="text-black font-bold text-lg">➤</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showFileUpload && <FileUpload onUpload={handleFileUpload} onClose={() => setShowFileUpload(false)} />}
      {showVoiceRecorder && <VoiceRecorder onUpload={handleFileUpload} onClose={() => setShowVoiceRecorder(false)} />}
      {showAI && <AIAssistant onClose={() => setShowAI(false)} />}

      {/* Video/Voice Call */}
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