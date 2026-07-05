'use client';
import { useState, useEffect } from 'react';
import axios from '../utils/axios';

export default function StarredModal({ onClose, onScrollTo }) {
  const [starred, setStarred] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStarred();
  }, []);

  const fetchStarred = async () => {
    try {
      const { data } = await axios.get('/extra/starred');
      setStarred(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstar = async (messageId) => {
    try {
      await axios.post(`/extra/star/${messageId}`);
      setStarred(prev => prev.filter(s => s.message?._id !== messageId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#1a1a2e] rounded-t-3xl">
          <h3 className="text-white font-bold">⭐ Starred Messages</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && <div className="text-center py-8 text-white/40">Loading...</div>}
          {!loading && starred.length === 0 && (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">⭐</p>
              <p className="text-white/40 text-sm">No starred messages yet</p>
              <p className="text-white/20 text-xs mt-1">Star messages to save them here</p>
            </div>
          )}
          {starred.map((item) => (
            <div key={item._id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {item.message?.sender?.avatar
                      ? <img src={item.message.sender.avatar} alt="" className="w-full h-full object-cover" />
                      : item.message?.sender?.name?.charAt(0)
                    }
                  </div>
                  <p className="text-purple-400 text-xs font-semibold">{item.message?.sender?.name}</p>
                </div>
                <button onClick={() => handleUnstar(item.message?._id)} className="text-yellow-400 text-sm flex-shrink-0">⭐</button>
              </div>
              <p className="text-white text-sm">{item.message?.content || '📎 Attachment'}</p>
              <p className="text-white/30 text-xs mt-2">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}