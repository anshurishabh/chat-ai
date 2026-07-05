'use client';
import { useState } from 'react';

export default function ScheduleModal({ onSchedule, onClose }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const now = new Date();
  const minDate = now.toISOString().split('T')[0];
  const minTime = now.toTimeString().slice(0, 5);

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) return;
    const scheduledAt = new Date(`${selectedDate}T${selectedTime}`);
    if (scheduledAt <= new Date()) {
      alert('Please select a future time');
      return;
    }
    onSchedule(scheduledAt.toISOString());
  };

  const QUICK_OPTIONS = [
    { label: 'In 1 hour', value: () => new Date(Date.now() + 3600000) },
    { label: 'Tonight 9 PM', value: () => { const d = new Date(); d.setHours(21, 0, 0, 0); if (d < new Date()) d.setDate(d.getDate() + 1); return d; } },
    { label: 'Tomorrow 9 AM', value: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; } },
    { label: 'Next Monday', value: () => { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); d.setHours(9, 0, 0, 0); return d; } },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-t-3xl md:rounded-3xl w-full md:w-96 p-5">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-bold">⏰ Schedule Message</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        {/* Quick options */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {QUICK_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onSchedule(opt.value().toISOString())}
              className="bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/50 text-white text-xs py-2.5 px-3 rounded-xl transition-all text-left"
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="text-white/30 text-xs text-center mb-4">— or pick a custom time —</div>

        <div className="space-y-3">
          <div>
            <label className="text-white/50 text-xs mb-1 block">Date</label>
            <input
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-purple-400 [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="text-white/50 text-xs mb-1 block">Time</label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-purple-400 [color-scheme:dark]"
            />
          </div>
          <button
            onClick={handleSchedule}
            disabled={!selectedDate || !selectedTime}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold rounded-xl transition-all"
          >
            ⏰ Schedule Message
          </button>
        </div>
      </div>
    </div>
  );
}