'use client';
import { useState } from 'react';
import useChatStore from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';
import ConfirmModal from './ConfirmModal';
import LinkPreview from './LinkPreview';
import axios from '../utils/axios';

const QUICK_REACTIONS = ['❤️', '😂', '👍', '😮', '😢', '🙏'];

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const extractUrl = (text) => {
  const match = text?.match(URL_REGEX);
  return match ? match[0] : null;
};

export default function MessageBubble({ msg, isMe, isGroup, onScrollToMessage, theme, onForward }) {
  const { user } = useAuthStore();
  const { editMessage, deleteMessage, toggleReaction, togglePin, setReplyingTo } = useChatStore();

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);
  const [saving, setSaving] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isLight = theme === 'light';

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText === msg.content) { setIsEditing(false); return; }
    setSaving(true);
    const ok = await editMessage(msg._id, editText);
    setSaving(false);
    if (ok) setIsEditing(false);
  };

  const handleStar = async () => {
    try {
      const { data } = await axios.post(`/extra/star/${msg._id}`);
      setIsStarred(data.starred);
    } catch (err) { console.error(err); }
  };

  const myReaction = msg.reactions?.find(r => r.user === user._id || r.user?._id === user._id);
  const urlInMessage = msg.type === 'text' ? extractUrl(msg.content) : null;

  const renderContent = () => {
    if (msg.isDeleted) return <p className="text-sm italic opacity-50">🚫 Deleted</p>;
    if (isEditing) return (
      <div className="min-w-[180px]">
        <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setIsEditing(false); }}
          className="w-full bg-black/20 text-white text-sm px-2 py-1 rounded border border-white/30 focus:outline-none" />
        <div className="flex gap-2 mt-1 text-xs">
          <button onClick={handleSaveEdit} disabled={saving} className="text-green-300 hover:underline">{saving ? '...' : 'Save'}</button>
          <button onClick={() => setIsEditing(false)} className="text-white/50 hover:underline">Cancel</button>
        </div>
      </div>
    );

    switch (msg.type) {
      case 'image':
        return (
          <div>
            <img src={msg.fileUrl} alt="image" className="max-w-[220px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.fileUrl, '_blank')} />
            {msg.content && msg.content !== '📎 ' && <p className="text-xs mt-1 opacity-70">{msg.content}</p>}
          </div>
        );
      case 'video':
        return <video src={msg.fileUrl} controls className="max-w-[220px] rounded-xl" />;
      case 'audio':
        return <div className="flex items-center gap-2"><span>🎤</span><audio src={msg.fileUrl} controls className="max-w-[180px]" /></div>;
      case 'pdf':
        return <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-300 hover:underline"><span>📄</span><span className="text-sm">{msg.content}</span></a>;
      default:
        return (
          <div>
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
            {urlInMessage && <LinkPreview url={urlInMessage} />}
          </div>
        );
    }
  };

  const sentBg = 'bg-gradient-to-br from-purple-600 to-pink-600';
  const receivedBg = isLight ? 'bg-white border border-gray-100 shadow-sm' : 'bg-white/10 border border-white/5';
  const textColor = isLight && !isMe ? 'text-gray-900' : 'text-white';

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`}>
      {!isMe && isGroup && (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end mb-1 overflow-hidden">
          {msg.sender?.avatar ? <img src={msg.sender.avatar} alt="" className="w-full h-full object-cover" /> : msg.sender?.name?.charAt(0)}
        </div>
      )}

      <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-1`}>
        {/* Action buttons on hover */}
        {!msg.isDeleted && !isEditing && (
          <div className={`hidden group-hover:flex items-center gap-1 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            <button onClick={() => setReplyingTo(msg)} className="w-7 h-7 rounded-full bg-black/30 backdrop-blur text-white/70 flex items-center justify-center text-xs hover:bg-black/50" title="Reply">↩️</button>
            <div className="relative">
              <button onClick={() => setShowReactionPicker(!showReactionPicker)} className="w-7 h-7 rounded-full bg-black/30 backdrop-blur text-white/70 flex items-center justify-center text-xs hover:bg-black/50">😊</button>
              {showReactionPicker && (
                <div className={`absolute bottom-9 ${isMe ? 'right-0' : 'left-0'} bg-[#1e1e30] border border-white/10 rounded-full px-2 py-1 flex gap-1 shadow-xl z-20`}>
                  {QUICK_REACTIONS.map((emoji) => (
                    <button key={emoji} onClick={() => { toggleReaction(msg._id, emoji); setShowReactionPicker(false); }} className="text-base hover:scale-125 transition-transform">{emoji}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setShowMenu(!showMenu)} className="w-7 h-7 rounded-full bg-black/30 backdrop-blur text-white/70 flex items-center justify-center text-xs hover:bg-black/50 relative">
              ⋮
              {showMenu && (
                <div className={`absolute bottom-9 ${isMe ? 'right-0' : 'left-0'} w-36 bg-[#1e1e30] border border-white/10 rounded-2xl shadow-xl z-20 overflow-hidden`}>
                  {[
                    { label: `${isStarred ? '⭐' : '☆'} Star`, action: handleStar },
                    { label: '📌 Pin', action: () => togglePin(msg._id) },
                    { label: '📤 Forward', action: () => onForward?.(msg) },
                    isMe && { label: '✏️ Edit', action: () => { setIsEditing(true); setEditText(msg.content); setShowMenu(false); } },
                    isMe && { label: '🗑️ Delete', action: () => { setShowDeleteConfirm(true); setShowMenu(false); }, color: 'text-red-400' },
                  ].filter(Boolean).map((item, i) => (
                    <button key={i} onClick={() => { item.action(); setShowMenu(false); }} className={`w-full text-left px-3 py-2 text-xs text-white hover:bg-white/5 ${item.color || ''}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </button>
          </div>
        )}

        {/* Message bubble */}
        <div className={`max-w-[260px] px-4 py-2.5 rounded-2xl ${isMe ? `${sentBg} text-white rounded-br-none` : `${receivedBg} ${textColor} rounded-bl-none`} ${msg.isPinned ? 'ring-1 ring-yellow-400/40' : ''}`}>
          {!isMe && isGroup && <p className="text-purple-400 text-xs font-semibold mb-1">{msg.sender?.name}</p>}
          {msg.isPinned && <p className="text-yellow-300 text-[9px] mb-1">📌 Pinned</p>}
          {msg.isSelfDestruct && !msg.isDeleted && <p className="text-red-300 text-[9px] mb-1">💣 Self-Destruct</p>}

          {/* Reply preview */}
          {msg.replyTo && (
            <div onClick={() => onScrollToMessage?.(msg.replyTo._id)} className={`mb-2 px-2 py-1 rounded-xl border-l-2 cursor-pointer ${isMe ? 'bg-black/15 border-white/40' : 'bg-black/10 border-purple-400'}`}>
              <p className={`text-[10px] font-semibold ${isMe ? 'text-white/70' : 'text-purple-400'}`}>{msg.replyTo.sender?.name}</p>
              <p className={`text-xs truncate ${isMe ? 'text-white/60' : 'text-gray-400'}`}>{msg.replyTo.content || '📎'}</p>
            </div>
          )}

          {renderContent()}

          <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-white/50' : isLight ? 'text-gray-400' : 'text-white/30'}`}>
            <p className="text-[10px]">
              {msg.isEdited && !msg.isDeleted && 'edited · '}
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            {isMe && !msg.isDeleted && <span className="text-[10px]">✓✓</span>}
          </div>
        </div>
      </div>

      {/* Reactions */}
      {msg.reactions?.length > 0 && (
        <div className={`flex ${isMe ? 'justify-end mr-2' : 'justify-start ml-9'} -mt-1`}>
          <div className={`rounded-full px-2 py-0.5 flex items-center gap-0.5 text-xs border ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#1e1e30] border-white/10'}`}>
            {Object.entries(msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})).map(([emoji, count]) => (
              <span key={emoji} className={myReaction?.emoji === emoji ? 'opacity-100' : 'opacity-70'}>{emoji}{count > 1 ? count : ''}</span>
            ))}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete message?"
          message="This will be deleted for everyone."
          confirmText="Delete"
          danger
          onConfirm={async () => { await deleteMessage(msg._id); setShowDeleteConfirm(false); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}