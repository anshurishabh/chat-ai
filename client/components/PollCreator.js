'use client';
import { useState } from 'react';
import axios from '../utils/axios';

export default function PollCreator({ chatId, groupId, onCreated, onClose }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [loading, setLoading] = useState(false);

  const addOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const removeOption = (i) => {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i));
  };

  const handleCreate = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) return;

    setLoading(true);
    try {
      const { data } = await axios.post('/extra/polls', {
        question,
        options: validOptions,
        chatId: chatId || null,
        groupId: groupId || null,
        allowMultiple,
      });
      onCreated(data);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-t-3xl md:rounded-3xl w-full md:w-96 p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-bold">📊 Create Poll</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white/50 text-xs mb-1 block">Question</label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What do you want to ask?"
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="text-white/50 text-xs mb-2 block">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-purple-400"
                  />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(i)} className="text-red-400 hover:text-red-300 px-2">✕</button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button onClick={addOption} className="w-full py-2 border border-dashed border-white/20 hover:border-purple-400 text-white/40 hover:text-purple-300 rounded-xl text-sm transition-colors">
                  + Add Option
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
            <p className="text-white text-sm">Allow multiple votes</p>
            <button
              onClick={() => setAllowMultiple(!allowMultiple)}
              className={`w-12 h-6 rounded-full transition-all relative ${allowMultiple ? 'bg-purple-500' : 'bg-white/20'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${allowMultiple ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !question.trim() || options.filter(o => o.trim()).length < 2}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl disabled:opacity-50"
          >
            {loading ? 'Creating...' : '📊 Create Poll'}
          </button>
        </div>
      </div>
    </div>
  );
}