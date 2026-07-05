'use client';
import { useState, useEffect } from 'react';
import axios from '../utils/axios';

export default function AnalyticsModal({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data } = await axios.get('/messages/analytics');
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const maxDaily = data?.dailyMessages?.length > 0 ? Math.max(...data.dailyMessages.map(d => d.count)) : 1;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#1a1a2e] rounded-t-3xl">
          <h3 className="text-white font-bold">📊 Chat Analytics</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white/40">Loading analytics...</div>
        ) : data ? (
          <div className="p-5 space-y-5">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Messages Sent', value: data.totalSent, icon: '📤', color: 'from-purple-500 to-pink-500' },
                { label: 'Messages Received', value: data.totalReceived, icon: '📥', color: 'from-blue-500 to-cyan-500' },
                { label: 'Last 30 Days', value: data.last30Days, icon: '📅', color: 'from-green-500 to-teal-500' },
                { label: 'Media Shared', value: data.mediaCount, icon: '📎', color: 'from-orange-500 to-yellow-500' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl mb-2`}>
                    {stat.icon}
                  </div>
                  <p className="text-white text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  <p className="text-white/40 text-xs">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Daily chart */}
            {data.dailyMessages?.length > 0 && (
              <div>
                <p className="text-white/60 text-sm font-semibold mb-3">📈 Last 7 Days Activity</p>
                <div className="flex items-end gap-2 h-24">
                  {data.dailyMessages.map((day) => (
                    <div key={day._id} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all"
                        style={{ height: `${(day.count / maxDaily) * 80}px`, minHeight: '4px' }}
                      />
                      <p className="text-white/30 text-[9px]">{day._id.slice(5)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top contacts */}
            {data.topContacts?.length > 0 && (
              <div>
                <p className="text-white/60 text-sm font-semibold mb-3">👥 Most Messaged</p>
                <div className="space-y-2">
                  {data.topContacts.map((contact, i) => (
                    <div key={contact._id} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                      <span className="text-white/30 text-xs w-4">{i + 1}</span>
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                        {contact.avatar ? <img src={contact.avatar} alt="" className="w-full h-full object-cover" /> : contact.name?.charAt(0)}
                      </div>
                      <p className="text-white text-sm flex-1">{contact.name}</p>
                      <p className="text-white/40 text-xs">{contact.count} msgs</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-white/40">No data available</div>
        )}
      </div>
    </div>
  );
}