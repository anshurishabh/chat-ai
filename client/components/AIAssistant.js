'use client';
import { useState } from 'react';
import useAIStore from '../store/useAIStore';

export default function AIAssistant({ onClose }) {
  const [input, setInput] = useState('');
  const { aiMessages, chatWithAI, loading, clearAIMessages } = useAIStore();

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    await chatWithAI(msg, aiMessages);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-gray-900 border border-green-500 rounded-2xl flex flex-col shadow-2xl z-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold text-sm">AI</div>
          <div>
            <p className="text-white font-semibold text-sm">NexChat AI</p>
            <p className="text-green-400 text-xs">● Always ready</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={clearAIMessages} className="text-gray-400 hover:text-yellow-400 text-xs border border-gray-600 px-2 py-1 rounded">Clear</button>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400 text-xs border border-gray-600 px-2 py-1 rounded">✕</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {aiMessages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            <div className="text-4xl mb-3">🤖</div>
            <p>Hi! I am NexChat AI.</p>
            <p className="text-xs mt-1">Ask me anything!</p>
          </div>
        )}
        {aiMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 px-3 py-2 rounded-xl text-sm text-gray-400">Thinking...</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI anything..."
          className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-600 focus:outline-none focus:border-green-400"
        />
        <button
          onClick={handleSend}
          className="bg-green-500 hover:bg-green-400 text-black px-3 py-2 rounded-lg text-sm font-bold"
        >
          ➤
        </button>
      </div>
    </div>
  );
}