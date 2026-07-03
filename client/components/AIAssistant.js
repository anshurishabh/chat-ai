'use client';
import { useState, useRef, useEffect } from 'react';
import useAIStore from '../store/useAIStore';
import useChatStore from '../store/useChatStore';

export default function AIAssistant() {
  const { aiMessages, chatWithAI, loading, clearAIMessages } = useAIStore();
  const { setShowAIChat } = useChatStore();
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

  const SUGGESTIONS = [
    'Help me write a message',
    'Translate something for me',
    'Summarize a topic',
    'Tell me a joke',
  ];

  return (
    <div className="flex-1 h-screen flex flex-col bg-[#0b141a]">
      {/* Header */}
      <div className="p-4 bg-[#202c33] flex items-center gap-3 border-b border-[#222d34]">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-xl">🤖</div>
        <div className="flex-1">
          <p className="text-white font-semibold">NexChat AI</p>
          <p className="text-green-400 text-xs">● Always active</p>
        </div>
        <button onClick={clearAIMessages} className="text-[#8696a0] hover:text-white text-xs border border-[#2a3942] px-2 py-1 rounded-full">Clear</button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ backgroundImage: 'radial-gradient(ellipse at center, #0d2137 0%, #0b141a 100%)' }}
      >
        {aiMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-6xl">🤖</div>
            <p className="text-white text-xl font-semibold">NexChat AI</p>
            <p className="text-[#8696a0] text-sm text-center">Your personal AI assistant. Ask me anything!</p>
            <div className="grid grid-cols-2 gap-2 mt-4 w-full max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-white text-xs px-3 py-2 rounded-xl border border-[#2a3942] text-left transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {aiMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-sm mr-2 flex-shrink-0 self-end">🤖</div>
            )}
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#005c4b] text-white rounded-br-none'
                : 'bg-[#202c33] text-white rounded-bl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-sm mr-2 flex-shrink-0">🤖</div>
            <div className="bg-[#202c33] px-4 py-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
              <div className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#202c33] flex items-center gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI anything..."
          className="flex-1 bg-[#2a3942] text-white px-4 py-3 rounded-full text-sm placeholder-[#8696a0] focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="w-12 h-12 bg-green-500 hover:bg-green-400 disabled:opacity-40 rounded-full flex items-center justify-center transition-colors"
        >
          <span className="text-black font-bold">➤</span>
        </button>
      </div>
    </div>
  );
}