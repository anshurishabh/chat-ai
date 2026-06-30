'use client';
import { useState } from 'react';

const CATEGORIES = {
  Smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'],
  Gestures: ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '💪', '🦾'],
  Hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  Objects: ['🔥', '✨', '🎉', '🎊', '🎈', '🎁', '🏆', '⭐', '🌟', '💯', '✅', '❌', '⚠️', '💡', '📌', '📎', '🔔', '🔕', '📷', '🎵', '🎶', '☕', '🍕', '🍔', '🍰', '🎂'],
  Faces: ['😎', '🤓', '🧐', '😏', '😒', '🙄', '😬', '😮', '😯', '😲', '😳', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '😱', '😨', '😰', '😥', '😓', '🤗', '😴', '🤤', '😪'],
};

export default function EmojiPicker({ onSelect, onClose }) {
  const [category, setCategory] = useState('Smileys');

  return (
    <div className="absolute bottom-16 left-0 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
      <div className="flex justify-between items-center p-3 border-b border-gray-800">
        <p className="text-white text-sm font-semibold">Emoji</p>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">✕</button>
      </div>

      <div className="flex gap-1 px-3 pt-2 overflow-x-auto">
        {Object.keys(CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`text-xs whitespace-nowrap px-2 py-1 rounded-full transition-colors ${
              category === cat ? 'bg-green-500 text-black font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-8 gap-1 p-3 max-h-48 overflow-y-auto">
        {CATEGORIES[category].map((emoji, i) => (
          <button
            key={i}
            onClick={() => onSelect(emoji)}
            className="text-xl hover:scale-125 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}