'use client';
import { useState, useEffect } from 'react';

const GIPHY_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

export default function GifPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    fetchTrending();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim()) fetchSearch(search);
      else setGifs(trending);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, trending]);

  const fetchTrending = async () => {
    try {
      if (!GIPHY_KEY) {
        setGifs(getFallbackGifs());
        setTrending(getFallbackGifs());
        setLoading(false);
        return;
      }
      const res = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=20&rating=g`);
      const data = await res.json();
      const formatted = data.data.map(g => ({
        id: g.id,
        url: g.images.fixed_height_small.url,
        preview: g.images.preview_gif.url,
        title: g.title,
      }));
      setGifs(formatted);
      setTrending(formatted);
    } catch {
      setGifs(getFallbackGifs());
      setTrending(getFallbackGifs());
    } finally {
      setLoading(false);
    }
  };

  const fetchSearch = async (query) => {
    try {
      if (!GIPHY_KEY) return;
      setLoading(true);
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`);
      const data = await res.json();
      setGifs(data.data.map(g => ({
        id: g.id,
        url: g.images.fixed_height_small.url,
        preview: g.images.preview_gif.url,
        title: g.title,
      })));
    } catch {
      console.error('GIF search failed');
    } finally {
      setLoading(false);
    }
  };

  const getFallbackGifs = () => [
    { id: '1', url: 'https://media.giphy.com/media/xT9IgG50Lg7rusyOA4/giphy.gif', title: 'Hello' },
    { id: '2', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', title: 'Thumbs up' },
    { id: '3', url: 'https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif', title: 'Party' },
    { id: '4', url: 'https://media.giphy.com/media/l46Cy1rHbQ92uuLXa/giphy.gif', title: 'Love' },
  ];

  return (
    <div className="absolute bottom-16 left-0 w-72 bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <p className="text-white font-semibold text-sm">GIFs</p>
        <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
      </div>
      <div className="p-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search GIFs..."
          className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-purple-400 mb-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-1 p-2 max-h-64 overflow-y-auto">
        {loading && <div className="col-span-2 text-center text-white/40 py-4 text-sm">Loading...</div>}
        {!loading && gifs.map((gif) => (
          <button
            key={gif.id}
            onClick={() => onSelect(gif.url, gif.title)}
            className="rounded-xl overflow-hidden hover:scale-95 transition-transform aspect-square"
          >
            <img src={gif.url} alt={gif.title} className="w-full h-full object-cover" loading="lazy" />
          </button>
        ))}
        {!loading && gifs.length === 0 && (
          <div className="col-span-2 text-center text-white/40 py-4 text-sm">No GIFs found</div>
        )}
      </div>
      <div className="p-2 border-t border-white/10 text-center">
        <p className="text-white/20 text-[9px]">Powered by GIPHY</p>
      </div>
    </div>
  );
}