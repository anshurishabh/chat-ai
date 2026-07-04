import { useEffect } from 'react';
import axios from '../utils/axios';
import useAuthStore from '../store/useAuthStore';

const useNotification = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    setupNotifications();
  }, [user]);

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

  const setupNotifications = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      await axios.post('/notifications/subscribe', {
        subscription,
        userId: user._id,
      });
    } catch (error) {
      console.error('Notification setup error:', error.message);
    }
  };
};

export default useNotification;