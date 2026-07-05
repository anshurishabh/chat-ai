'use client';
import { useState } from 'react';
import axios from '../utils/axios';
import useAuthStore from '../store/useAuthStore';

export default function PollMessage({ poll: initialPoll }) {
  const { user } = useAuthStore();
  const [poll, setPoll] = useState(initialPoll);

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);

  const hasVoted = (option) => option.votes.some(v => v === user._id || v?._id === user._id);

  const handleVote = async (index) => {
    if (!poll.isActive) return;
    try {
      const { data } = await axios.post(`/extra/polls/${poll._id}/vote`, { optionIndex: index });
      setPoll(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[220px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📊</span>
        <div>
          <p className="text-xs text-purple-400 font-semibold">Poll</p>
          <p className="text-white text-sm font-medium">{poll.question}</p>
        </div>
      </div>

      <div className="space-y-2">
        {poll.options.map((option, i) => {
          const pct = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
          const voted = hasVoted(option);

          return (
            <button
              key={i}
              onClick={() => handleVote(i)}
              disabled={!poll.isActive}
              className={`w-full text-left rounded-xl overflow-hidden border transition-all ${voted ? 'border-purple-400' : 'border-white/10 hover:border-white/30'}`}
            >
              <div className="relative px-3 py-2">
                <div
                  className={`absolute inset-0 ${voted ? 'bg-purple-500/20' : 'bg-white/5'} rounded-xl transition-all`}
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex justify-between items-center">
                  <span className={`text-xs ${voted ? 'text-purple-300' : 'text-white/70'}`}>{option.text}</span>
                  <span className="text-xs text-white/40">{pct}%</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-white/30 text-xs mt-2 text-right">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''} • {poll.isActive ? 'Active' : 'Ended'}
      </p>
    </div>
  );
}