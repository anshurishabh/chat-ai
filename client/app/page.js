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
  const { selectedUser, selectedGroup, showAIChat } = useChatStore();
  const [mounted, setMounted] = useState(false);

  useNotification();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  if (!user) return <AuthForm />;

  const showRight = selectedUser || selectedGroup || showAIChat;

  return (
    <div className="flex h-screen bg-[#111b21] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex">
        {!showRight ? (
          // Welcome screen
          <div className="flex-1 h-screen bg-[#222e35] flex flex-col items-center justify-center gap-4">
            <div className="text-7xl">💬</div>
            <h2 className="text-white text-2xl font-light">NexChat</h2>
            <p className="text-[#8696a0] text-sm text-center max-w-xs">
              Send and receive messages, make calls, and use AI features.
              Select a chat from the left or search for someone.
            </p>
            <p className="text-[#8696a0] text-xs mt-2">
              Type <span className="text-green-400 font-mono">/imagine</span> in any chat to generate AI images
            </p>
          </div>
        ) : showAIChat ? (
          <AIAssistant />
        ) : (
          <ChatWindow />
        )}
      </div>
    </div>
  );
}