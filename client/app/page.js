'use client';
import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import AuthForm from '../components/AuthForm';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import AIAssistant from '../components/AIAssistant';
import useNotification from '../hooks/useNotification';
import useChatStore from '../store/useChatStore';

export default function Home() {
  const { user, theme } = useAuthStore();
  const { selectedUser, selectedGroup, showAIChat, setShowAIChat } = useChatStore();
  const [mounted, setMounted] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useNotification();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (selectedUser || selectedGroup || showAIChat) {
      setShowChat(true);
    }
  }, [selectedUser, selectedGroup, showAIChat]);

  // Apply theme to document
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme || 'dark');
    }
  }, [theme, mounted]);

  if (!mounted) return null;
  if (!user) return <AuthForm />;

  const handleBack = () => {
    setShowChat(false);
    setShowAIChat(false);
  };

  const hasSelection = selectedUser || selectedGroup || showAIChat;

  return (
    <div className="h-screen w-screen overflow-hidden flex" data-theme={theme || 'dark'} style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <div className={`${showChat ? 'hidden' : 'flex'} flex-col md:flex md:w-[360px] md:flex-shrink-0 w-full h-full`}
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
      >
        <Sidebar onSelectChat={() => setShowChat(true)} />
      </div>

      {/* Main area */}
      <div className={`${showChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col h-full`}>
        {!hasSelection ? (
          <div className="flex-1 h-full flex flex-col items-center justify-center gap-6" style={{ background: 'var(--bg-primary)' }}>
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-6xl animate-glow">
              💬
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>NexChat</h2>
              <p className="text-sm max-w-xs px-4" style={{ color: 'var(--text-secondary)' }}>
                Search for someone to start chatting, or tap 🤖 to chat with AI
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Type <span className="text-purple-400 font-mono">/imagine</span> to generate AI images
              </p>
            </div>
          </div>
        ) : showAIChat ? (
          <AIAssistant onBack={handleBack} />
        ) : (
          <ChatWindow onBack={handleBack} />
        )}
      </div>
    </div>
  );
}