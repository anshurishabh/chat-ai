'use client';
import { useState, useEffect, useRef } from 'react';
import axios from '../utils/axios';

export default function SharedNoteModal({ chatId, onClose }) {
  const [note, setNote] = useState({ title: 'Shared Note', content: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    fetchNote();
  }, []);

  const fetchNote = async () => {
    try {
      const { data } = await axios.get(`/extra/notes/${chatId}`);
      setNote(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (field, value) => {
    setNote(prev => ({ ...prev, [field]: value }));
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNote({ ...note, [field]: value }), 1000);
  };

  const saveNote = async (noteData) => {
    setSaving(true);
    try {
      await axios.put(`/extra/notes/${chatId}`, { title: noteData.title, content: noteData.content });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-3xl w-full max-w-lg h-[80vh] flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <input
              value={note.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none text-sm"
              placeholder="Note title..."
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/30 text-xs">{saving ? 'Saving...' : saved ? '✅ Saved' : ''}</span>
            <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
          </div>
        </div>
        <textarea
          value={note.content}
          onChange={(e) => handleChange('content', e.target.value)}
          placeholder="Start typing your shared note here...\n\nThis note is shared with everyone in this conversation."
          className="flex-1 bg-transparent text-white p-5 resize-none focus:outline-none text-sm leading-relaxed"
        />
        <div className="p-3 border-t border-white/10 flex justify-between items-center">
          <p className="text-white/20 text-xs">{note.content.length} characters</p>
          <button
            onClick={() => saveNote(note)}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold rounded-xl"
          >
            Save Now
          </button>
        </div>
      </div>
    </div>
  );
}