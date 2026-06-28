'use client';
import { useEffect } from 'react';
import axios from '../utils/axios';
import useAuthStore from '../store/useAuthStore';

const useNotification = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    registerServiceWorker();
  }, [user]);

  const registerServiceWorker = async () => {
    // SECURITY CHECK: Agar feature support nahi karta, toh yahi ruk jao.
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser environment.');
      return; 
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      // Service Worker register karo
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // WAIT FOR READY: Service worker ke active hone ka intezar karo
      await navigator.serviceWorker.ready;

      try {
        const { data } = await axios.get('/notifications/vapid-public-key');
        const publicKey = data.publicKey;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await axios.post('/notifications/subscribe', {
          subscription,
          userId: user._id,
        });

        console.log('Push notifications enabled!');
      } catch (err) {
        // Agar VAPID key ya subscription fail ho, toh error log karo par crash mat hone do
        console.warn('Push subscription failed, but continuing app load:', err.message);
      }
    } catch (error) {
      console.error('Notification setup error (Non-critical):', error.message);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };
};

export default useNotification;