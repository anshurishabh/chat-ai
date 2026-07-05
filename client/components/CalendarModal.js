'use client';
import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import useAuthStore from '../store/useAuthStore';

const COLORS = ['#7c3aed', '#db2777', '#059669', '#d97706', '#2563eb', '#dc2626'];

export default function CalendarModal({ chatId, onClose }) {
  const { user } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startTime: '', endTime: '', color: '#7c3aed', isAllDay: false });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await axios.get(`/extra/calendar/${chatId}`);
      setEvents(data);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async () => {
    if (!form.title || !form.startTime) return;
    try {
      const { data } = await axios.post('/extra/calendar', { ...form, chatId, participants: [user._id] });
      setEvents(prev => [...prev, data]);
      setShowForm(false);
      setForm({ title: '', description: '', startTime: '', endTime: '', color: '#7c3aed', isAllDay: false });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/extra/calendar/${id}`);
      setEvents(prev => prev.filter(e => e._id !== id));
    } catch (err) { console.error(err); }
  };

  const groupByDate = (events) => {
    return events.reduce((acc, event) => {
      const date = new Date(event.startTime).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {});
  };

  const grouped = groupByDate(events);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a1a2e] rounded-t-3xl">
          <h3 className="text-white font-bold">🗓️ Shared Calendar</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)} className="text-purple-400 text-xs border border-purple-500/30 px-3 py-1 rounded-full hover:bg-purple-500/10">+ Event</button>
            <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {showForm && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="Event title" className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-purple-400" />
              <input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Description (optional)" className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-purple-400" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Start</label>
                  <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({...form, startTime: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-purple-400 [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">End</label>
                  <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({...form, endTime: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-purple-400 [color-scheme:dark]" />
                </div>
              </div>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm({...form, color: c})} className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white/50' : ''}`} style={{ background: c }} />
                ))}
              </div>
              <button onClick={handleCreate} className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-sm">Create Event</button>
            </div>
          )}

          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🗓️</p>
              <p className="text-white/40 text-sm">No events yet. Create one!</p>
            </div>
          )}

          {Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date}>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">{date}</p>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div key={event._id} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                    <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ background: event.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{event.title}</p>
                      {event.description && <p className="text-white/40 text-xs truncate">{event.description}</p>}
                      <p className="text-white/30 text-xs mt-0.5">
                        {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {event.endTime && ` — ${new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>
                    {event.creator?._id === user._id && (
                      <button onClick={() => handleDelete(event._id)} className="text-red-400/50 hover:text-red-400 text-xs">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}