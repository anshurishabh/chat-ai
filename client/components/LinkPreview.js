'use client';
import { useEffect, useState } from 'react';

export default function LinkPreview({ url }) {
  const [domain, setDomain] = useState('');

  useEffect(() => {
    try {
      if (url) {
        const parsed = new URL(url);
        setDomain(parsed.hostname);
      }
    } catch (err) {
      console.error('Invalid URL parsing:', err);
    }
  }, [url]);

  if (!url) return null;

  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-white/10 bg-black/20 hover:bg-black/30 transition-all max-w-sm">
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block p-3 space-y-1 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-400">🔗 Link Detected</span>
          <span className="text-[10px] text-white/40 truncate group-hover:text-white/60 transition-colors">
            {domain}
          </span>
        </div>
        <p className="text-sm text-blue-400 font-medium truncate group-hover:underline">
          {url}
        </p>
        <p className="text-xs text-white/50 line-clamp-1">
          Click to open this link layout resource safely.
        </p>
      </a>
    </div>
  );
}