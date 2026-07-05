'use client';
import { useState, useEffect } from 'react';

// Simple link preview using meta tags via API
export default function LinkPreview({ url }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreview();
  }, [url]);

  const fetchPreview = async () => {
    try {
      // Use a free link preview service
      const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.status === 'success') {
        setPreview({
          title: data.data.title,
          description: data.data.description,
          image: data.data.image?.url,
          url: data.data.url,
        });
      }
    } catch (err) {
      console.error('Link preview failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-2 bg-white/5 border border-white/10 rounded-xl p-3 animate-pulse">
        <div className="h-3 bg-white/10 rounded w-3/4 mb-2" />
        <div className="h-2 bg-white/5 rounded w-1/2" />
      </div>
    );
  }

  if (!preview) return null;

  return (
    <a href={url} target="_blank" rel="noreferrer" className="mt-2 block bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl overflow-hidden transition-colors">
      {preview.image && (
        <img src={preview.image} alt={preview.title} className="w-full h-32 object-cover" onError={(e) => e.target.style.display = 'none'} />
      )}
      <div className="p-3">
        <p className="text-white text-xs font-semibold truncate">{preview.title}</p>
        {preview.description && <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{preview.description}</p>}
        <p className="text-purple-400 text-[10px] mt-1 truncate">{url}</p>
      </div>
    </a>
  );
}