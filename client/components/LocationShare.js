'use client';
import { useState } from 'react';

export default function LocationShare({ onShare, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);

  const getLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocation({ latitude, longitude, accuracy });
        setLoading(false);
      },
      (err) => {
        setError('Location access denied. Please allow location in browser settings.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleShare = () => {
    if (!location) return;
    const mapsUrl = `https://maps.google.com/maps?q=${location.latitude},${location.longitude}`;
    onShare({
      type: 'location',
      content: `📍 My Location\nLat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}\n\n${mapsUrl}`,
      locationData: location,
      mapsUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-t-3xl md:rounded-3xl w-full md:w-96 p-5">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-bold">📍 Share Location</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        {!location ? (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-4xl mx-auto">
              📍
            </div>
            <div>
              <p className="text-white font-semibold">Share your location</p>
              <p className="text-white/40 text-sm mt-1">Your browser will ask for permission</p>
            </div>
            {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-2">{error}</p>}
            <button
              onClick={getLocation}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-2xl disabled:opacity-50"
            >
              {loading ? '📍 Getting location...' : '📍 Get My Location'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-green-400 text-xs font-semibold mb-1">✅ Location found!</p>
              <p className="text-white text-sm">Lat: {location.latitude.toFixed(6)}</p>
              <p className="text-white text-sm">Lng: {location.longitude.toFixed(6)}</p>
              <p className="text-white/40 text-xs mt-1">Accuracy: ±{Math.round(location.accuracy)}m</p>
            </div>
            
              href={`https://maps.google.com/maps?q=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="block text-center text-purple-400 text-sm hover:underline"
            >
              👁️ Preview on Google Maps
            </a>
            <div className="flex gap-3">
              <button onClick={() => setLocation(null)} className="flex-1 py-3 border border-white/20 text-white/60 rounded-2xl text-sm hover:bg-white/5">
                🔄 Retry
              </button>
              <button onClick={handleShare} className="flex-1 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-2xl text-sm">
                📤 Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}