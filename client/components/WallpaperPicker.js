'use client';
import axios from '../utils/axios';

const PRESET_WALLPAPERS = [
  { name: 'Default', url: '' },
  { name: 'Midnight', url: 'linear-gradient(135deg, #0f172a, #1e293b)' },
  { name: 'Forest', url: 'linear-gradient(135deg, #064e3b, #022c22)' },
  { name: 'Ocean', url: 'linear-gradient(135deg, #0c4a6e, #082f49)' },
  { name: 'Sunset', url: 'linear-gradient(135deg, #7c2d12, #431407)' },
  { name: 'Violet', url: 'linear-gradient(135deg, #4c1d95, #2e1065)' },
];

export default function WallpaperPicker({ chatId, currentWallpaper, onSelect, onClose }) {
  const handleSelect = async (url) => {
    try {
      await axios.put('/auth/wallpaper', { chatId, wallpaperUrl: url });
      onSelect(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-80 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold text-sm">🎨 Chat Wallpaper</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {PRESET_WALLPAPERS.map((wp) => (
            <button
              key={wp.name}
              onClick={() => handleSelect(wp.url)}
              className={`h-16 rounded-xl border-2 transition-all ${
                currentWallpaper === wp.url ? 'border-green-400 scale-105' : 'border-gray-700 hover:border-gray-500'
              }`}
              style={{ background: wp.url || '#030712' }}
              title={wp.name}
            >
              {!wp.url && <span className="text-gray-500 text-[10px]">None</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}