'use client';
import { useState } from 'react';
import useChatStore from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';
import ConfirmModal from './ConfirmModal';

const QUICK_REACTIONS = ['❤️', '😂', '👍', '😮', '😢', '🙏'];

export default function MessageBubble({ msg, isMe, isGroup, onScrollToMessage }) {
  const { user } = useAuthStore();
  const { editMessage, deleteMessage, toggleReaction, togglePin, setReplyingTo } = useChatStore();

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);
  const [saving, setSaving] = useState(false);

  const handleStartEdit = () => {
    setEditText(msg.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(msg.content);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText === msg.content) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    const ok = await editMessage(msg._id, editText);
    setSaving(false);
    if (ok) setIsEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDeleteConfirmed = async () => {
    await deleteMessage(msg._id);
    setShowDeleteConfirm(false);
  };

  const handleReact = (emoji) => {
    toggleReaction(msg._id, emoji);
    setShowReactionPicker(false);
  };

  const myReaction = msg.reactions?.find(r => r.user === user._id || r.user?._id === user._id);

  const renderContent = () => {
    if (msg.isDeleted) {
      return <p className="text-sm italic text-gray-400">🚫 This message was deleted</p>;
    }

    if (isEditing) {
      return (
        <div className="min-w-[200px]">
          <input
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleEditKeyDown}
            className="w-full bg-black/20 text-white text-sm px-2 py-1 rounded border border-white/30 focus:outline-none"
          />
          <div className="flex gap-2 mt-1 text-xs">
            <button onClick={handleSaveEdit} disabled={saving} className="text-green-300 hover:underline disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={handleCancelEdit} className="text-gray-300 hover:underline">Cancel</button>
          </div>
        </div>
      );
    }

    switch (msg.type) {
      case 'image':
        return (
          <img
            src={msg.fileUrl}
            alt="image"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
            onClick={() => window.open(msg.fileUrl, '_blank')}
          />
        );
      case 'video':
        return <video src={msg.fileUrl} controls className="max-w-xs rounded-lg" />;
      case 'audio':
        return (
          <div className="flex items-center gap-2">
            <span>🎤</span>
            <audio src={msg.fileUrl} controls className="max-w-xs" />
          </div>
        );
      case 'pdf':
        return (
          <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-300 hover:underline">
            <span>📄</span>
            <span className="text-sm">{msg.content}</span>
          </a>
        );
      default:
        return <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>;
    }
  };

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
      {!isMe && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs mr-2 flex-shrink-0 self-end">
          {msg.sender?.name?.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex items-end gap-1 max-w-xs lg:max-w-md relative">
        {/* Hover action icons — left side for "me" messages, right side for others */}
        {!msg.isDeleted && !isEditing && (
          <div
            className={`hidden group-hover:flex items-center gap-1 ${isMe ? 'order-first' : 'order-last'}`}
          >
            <button
              onClick={() => setReplyingTo(msg)}
              title="Reply"
              className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center text-xs"
            >
              ↩️
            </button>
            <div className="relative">
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                title="React"
                className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center text-xs"
              >
                😊
              </button>
              {showReactionPicker && (
                <div className={`absolute bottom-9 ${isMe ? 'right-0' : 'left-0'} bg-gray-800 border border-gray-600 rounded-full px-2 py-1 flex gap-1 shadow-xl z-20`}>
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(emoji)}
                      className="text-base hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => togglePin(msg._id)}
              title={msg.isPinned ? 'Unpin' : 'Pin'}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${msg.isPinned ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
            >
              📌
            </button>
            {isMe && (
              <>
                <button
                  onClick={handleStartEdit}
                  title="Edit"
                  className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center text-xs"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete"
                  className="w-7 h-7 rounded-full bg-gray-800 hover:bg-red-500/20 text-gray-300 hover:text-red-400 flex items-center justify-center text-xs"
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        )}

        <div
          className={`px-4 py-2 rounded-2xl ${
            isMe
              ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-none'
              : 'bg-gray-800 text-white rounded-bl-none'
          } ${msg.isPinned ? 'ring-1 ring-yellow-400/60' : ''}`}
        >
          {!isMe && isGroup && (
            <p className="text-green-400 text-xs font-semibold mb-1">{msg.sender?.name}</p>
          )}

          {msg.isPinned && (
            <p className="text-[10px] text-yellow-300 mb-1 flex items-center gap-1">📌 Pinned</p>
          )}

          {/* Reply preview inside bubble */}
          {msg.replyTo && (
            <div
              onClick={() => onScrollToMessage?.(msg.replyTo._id)}
              className={`mb-1 px-2 py-1 rounded-lg border-l-2 cursor-pointer ${isMe ? 'bg-black/15 border-white/50' : 'bg-black/20 border-green-400'}`}
            >
              <p className={`text-[10px] font-semibold ${isMe ? 'text-green-100' : 'text-green-400'}`}>
                {msg.replyTo.sender?.name}
              </p>
              <p className={`text-xs truncate ${isMe ? 'text-green-50' : 'text-gray-300'}`}>
                {msg.replyTo.type === 'text' ? msg.replyTo.content : '📎 Attachment'}
              </p>
            </div>
          )}

          {renderContent()}

          <div className="flex items-center justify-between gap-2 mt-1">
            <p className={`text-xs ${isMe ? 'text-green-200' : 'text-gray-400'}`}>
              {msg.isEdited && !msg.isDeleted && 'edited · '}
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {isMe && !msg.isDeleted && ' ✓✓'}
            </p>
          </div>
        </div>
      </div>

      {/* Reactions strip below bubble */}
      {msg.reactions?.length > 0 && (
        <div className={`flex ${isMe ? 'justify-end mr-2' : 'justify-start ml-10'} -mt-1`}>
          <div className="bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5 flex items-center gap-1 text-xs">
            {Object.entries(
              msg.reactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {})
            ).map(([emoji, count]) => (
              <span key={emoji} className={myReaction?.emoji === emoji ? 'opacity-100' : 'opacity-80'}>
                {emoji}{count > 1 ? count : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete message?"
          message="This message will be deleted for everyone. This action cannot be undone."
          confirmText="Delete"
          danger
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}