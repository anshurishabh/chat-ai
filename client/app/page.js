'use client';
import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import AuthForm from '../components/AuthForm';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import useNotification from '../hooks/useNotification';

export default function Home() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useNotification();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <ChatWindow />
    </div>
  );
}