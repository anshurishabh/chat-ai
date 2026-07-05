'use client';
import { useState, useEffect } from 'react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('pwa-dismissed');
      if (!dismissed) setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="bg-[#1a1a2e] border border-purple-500/30 rounded-2xl p-4 shadow-2xl shadow-purple-500/10 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl flex-shrink-0">💬</div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Install NexChat</p>
          <p className="text-white/40 text-xs">Add to home screen for best experience</p>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button onClick={handleInstall} className="bg-purple-500 hover:bg-purple-400 text-white text-xs px-3 py-1.5 rounded-xl font-bold transition-colors">Install</button>
          <button onClick={handleDismiss} className="text-white/30 hover:text-white text-xs px-2 py-1 transition-colors">Later</button>
        </div>
      </div>
    </div>
  );
}