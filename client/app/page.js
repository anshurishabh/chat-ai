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
  const { user } = useAuthStore();
  const { selectedUser, selectedGroup, showAIChat, setShowAIChat } = useChatStore();
  const [mounted, setMounted] = useState(false);
  const [showChat, setShowChat] = useState(false); // Mobile: show chat panel

  useNotification();

  useEffect(() => { setMounted(true); }, []);

  // Jab bhi user/group/AI select ho, mobile pe chat panel kholo
  useEffect(() => {
    if (selectedUser || selectedGroup || showAIChat) {
      setShowChat(true);
    }
  }, [selectedUser, selectedGroup, showAIChat]);

  if (!mounted) return null;
  if (!user) return <AuthForm />;

  const handleBack = () => {
    setShowChat(false);
    setShowAIChat(false);
  };

  const hasSelection = selectedUser || selectedGroup || showAIChat;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0f0f1a] flex">

      {/* Desktop: dono side by side */}
      {/* Mobile: sirf ek dikhao */}

      {/* Sidebar */}
      <div className={`
        ${showChat ? 'hidden' : 'flex'} flex-col
        md:flex md:w-[360px] md:flex-shrink-0
        w-full h-full
      `}>
        <Sidebar onSelectChat={() => setShowChat(true)} />
      </div>

      {/* Chat / AI area */}
      <div className={`
        ${showChat ? 'flex' : 'hidden'} flex-1 flex-col
        md:flex
        h-full
      `}>
        {!hasSelection ? (
          // Desktop welcome screen
          <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#0a0a14] gap-4">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-5xl">💬</div>
            <h2 className="text-white text-2xl font-bold">NexChat</h2>
            <p className="text-white/40 text-sm text-center max-w-xs px-4">
              Search for someone to start chatting, or tap 🤖 to chat with AI
            </p>
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