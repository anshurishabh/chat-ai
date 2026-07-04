'use client';
import { useRef } from 'react';
import axios from '../utils/axios';

const PRESET_WALLPAPERS = [
  { name: 'Default', value: '', preview: '#0a0a14' },
  { name: 'Cosmic', value: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', preview: '#302b63' },
  { name: 'Aurora', value: 'linear-gradient(135deg, #003973, #e5e5be)', preview: '#003973' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #f093fb, #f5576c)', preview: '#f5576c' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #0575e6, #021b79)', preview: '#0575e6' },
  { name: 'Forest', value: 'linear-gradient(135deg, #134e5e, #71b280)', preview: '#134e5e' },
  { name: 'Midnight', value: 'linear-gradient(135deg, #232526, #414345)', preview: '#232526' },
  { name: 'Candy', value: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', preview: '#a18cd1' },
  { name: 'Fire', value: 'linear-gradient(135deg, #f7971e, #ffd200)', preview: '#f7971e' },
];

export default function WallpaperPicker({ chatId, currentWallpaper, onSelect, onClose }) {
  const fileRef = useRef(null);

  const handleSelect = async (value) => {
    try {
      await axios.put('/auth/wallpaper', { chatId, wallpaperUrl: value });
      onSelect(value);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = `url(${data.url})`;
      await handleSelect(imageUrl);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-50">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-t-3xl md:rounded-3xl w-full md:w-96 p-5 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-bold">🎨 Chat Wallpaper</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        {/* Custom upload */}
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full mb-4 py-3 border-2 border-dashed border-white/20 hover:border-purple-400 rounded-2xl text-white/50 hover:text-purple-300 text-sm transition-colors flex items-center justify-center gap-2"
        >
          📷 Upload Custom Photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} />

        {/* Presets */}
        <div className="grid grid-cols-3 gap-3">
          {PRESET_WALLPAPERS.map((wp) => (
            <button
              key={wp.name}
              onClick={() => handleSelect(wp.value)}
              className={`aspect-square rounded-2xl border-2 transition-all overflow-hidden relative ${
                currentWallpaper === wp.value ? 'border-purple-400 scale-95' : 'border-white/10 hover:border-white/30'
              }`}
              style={{ background: wp.preview }}
              title={wp.name}
            >
              <span className="absolute bottom-1 left-0 right-0 text-center text-white text-[9px] font-medium drop-shadow">{wp.name}</span>
              {currentWallpaper === wp.value && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="text-white text-lg">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}