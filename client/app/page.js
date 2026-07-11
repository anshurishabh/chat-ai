'use client';
import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import AuthForm from '../components/AuthForm';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import AIAssistant from '../components/AIAssistant';

export default function Home() {
  const { user, hydrateAuth, isHydrated } = useAuthStore();
  const { selectedUser, selectedGroup, showAIChat, setShowAIChat, setSelectedUser, setSelectedGroup } = useChatStore();
  const [activeView, setActiveView] = useState('list');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPWA, setShowPWA] = useState(false);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  // Aggressive Service Worker Registration Hook for Mobile Chrome Compatibility
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // Unregister any stale service workers first to clear the slate
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (let registration of registrations) {
            await registration.unregister();
          }
          
          // Register fresh service worker from public domain path
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          console.log('🚀 Mobile PWA Engine Activated Successfully:', reg.scope);
        } catch (err) {
          console.error('Service Worker registration crash context:', err);
        }
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  // Capture installation hooks from android/mobile environments
  useEffect(() => {
    const handler = (e) => {
      console.log('🎯 PWA Installation Prompt Captured By Chrome Engine');
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('pwa-dismissed');
      if (!dismissed) setShowPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install application.');
      setShowPWA(false);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    if (selectedUser || selectedGroup || showAIChat) {
      setActiveView('chat');
    } else {
      setActiveView('list');
    }
  }, [selectedUser, selectedGroup, showAIChat]);

  const handleBackToList = () => {
    setSelectedUser(null);
    setSelectedGroup(null);
    setShowAIChat(false);
    setActiveView('list');
  };

  if (!isHydrated) {
    return (
      <div className="w-screen h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <main className="flex w-screen h-screen overflow-hidden bg-[#0a0a14] relative">
      {/* PWA Floating Native Banner Trigger Overlay */}
      {showPWA && (
        <div className="fixed bottom-6 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80 animate-slideUp">
          <div className="bg-[#16162a] border-2 border-purple-500/40 rounded-3xl p-4 shadow-2xl flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg shadow-purple-500/20">💬</div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Download NexChat</p>
              <p className="text-white/40 text-[11px] leading-tight">Add to your phone workspace app screen instantly</p>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button onClick={handlePWAInstall} className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-2 rounded-xl font-bold transition-all shadow-md shadow-purple-600/30">Download</button>
              <button onClick={() => { setShowPWA(false); localStorage.setItem('pwa-dismissed', 'true'); }} className="text-white/30 hover:text-white text-[10px] py-1 text-center transition-colors">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex w-full h-full relative">
        <div className={`w-full md:w-[380px] h-full border-r border-white/5 flex-shrink-0 ${activeView === 'list' ? 'block' : 'hidden md:block'}`}>
          <Sidebar onSelectChat={() => setActiveView('chat')} />
        </div>

        <div className={`flex-1 h-full relative ${activeView === 'chat' ? 'block' : 'hidden md:block'}`}>
          {showAIChat ? (
            <AIAssistant onBack={handleBackToList} />
          ) : selectedUser || selectedGroup ? (
            <ChatWindow onBack={handleBackToList} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a14] text-center p-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-4xl shadow-2xl shadow-purple-500/10 animate-pulse mb-6">
                💬
              </div>
              <h2 className="text-xl font-bold text-white mb-2">NexChat Space Ecosystem</h2>
              <p className="text-white/40 text-sm max-w-sm">Select a diagnostic contact channel or invoke the tactical intelligence engine dashboard to begin streaming encryption data blocks.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}