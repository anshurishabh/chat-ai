'use client';
import { useState, useRef, useEffect } from 'react';
import useAIStore from '../store/useAIStore';
import useChatStore from '../store/useChatStore';

const SUGGESTIONS = [
  { icon: '✍️', text: 'Help me write a message' },
  { icon: '🌍', text: 'Translate something for me' },
  { icon: '📝', text: 'Summarize a topic' },
  { icon: '💡', text: 'Give me an idea' },
  { icon: '😄', text: 'Tell me a joke' },
  { icon: '🔢', text: 'Solve a math problem' },
];

export default function AIAssistant({ onBack }) {
  const { aiMessages, chatWithAI, loading, clearAIMessages } = useAIStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const msg = input;
    setInput('');
    await chatWithAI(msg, aiMessages);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0f0f1a] relative">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-gradient-to-b from-[#1a0a2e]/95 to-transparent backdrop-blur-md flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0"
        >
          ←
        </button>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-xl flex-shrink-0">🤖</div>
        <div>
          <p className="text-white font-semibold">NexChat AI</p>
          <p className="text-green-400 text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse"></span>
            Always active
          </p>
        </div>
        <div className="ml-auto">
          <button onClick={clearAIMessages} className="text-white/30 hover:text-white text-xs border border-white/10 px-3 py-1 rounded-full transition-colors">Clear</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {aiMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-5 py-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-4xl shadow-2xl shadow-green-500/20">🤖</div>
            <div className="text-center">
              <p className="text-white font-bold text-xl">NexChat AI</p>
              <p className="text-white/40 text-sm mt-1">Your intelligent chat companion</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs mt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => setInput(s.text)}
                  className="bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/50 text-left px-3 py-2.5 rounded-2xl transition-all"
                >
                  <span className="block text-lg mb-1">{s.icon}</span>
                  <span className="text-white/60 hover:text-white text-xs leading-tight">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {aiMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-sm flex-shrink-0">🤖</div>
            )}
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-br-none'
                : 'bg-white/10 text-white rounded-bl-none border border-white/10'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-sm flex-shrink-0">🤖</div>
            <div className="bg-white/10 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1">
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-8 pt-2">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 focus-within:border-purple-400/50 rounded-3xl px-4 py-3 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              rows={1}
              style={{ resize: 'none', maxHeight: '100px' }}
              className="w-full bg-transparent text-white text-sm placeholder-white/30 focus:outline-none leading-relaxed"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 disabled:opacity-40 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20 flex-shrink-0"
          >
            <span className="text-white font-bold">➤</span>
          </button>
        </div>
      </div>
    </div>
  );
}