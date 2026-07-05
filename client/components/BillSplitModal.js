'use client';
import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import useAuthStore from '../store/useAuthStore';

export default function BillSplitModal({ chatId, chatUsers = [], onClose }) {
  const { user } = useAuthStore();
  const [bills, setBills] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchBills(); }, []);

  useEffect(() => {
    if (chatUsers.length > 0) {
      const perPerson = totalAmount ? (parseFloat(totalAmount) / chatUsers.length).toFixed(2) : 0;
      setSplits(chatUsers.map(u => ({ user: u._id, name: u.name, amount: parseFloat(perPerson) })));
    }
  }, [totalAmount, chatUsers]);

  const fetchBills = async () => {
    try {
      const { data } = await axios.get(`/extra/bills/chat/${chatId}`);
      setBills(data);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async () => {
    if (!title || !totalAmount || splits.length === 0) return;
    setLoading(true);
    try {
      const { data } = await axios.post('/extra/bills', {
        title, totalAmount: parseFloat(totalAmount), currency,
        splits: splits.map(s => ({ user: s.user, amount: s.amount })),
        chatId,
      });
      setBills(prev => [data, ...prev]);
      setShowForm(false);
      setTitle(''); setTotalAmount('');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleMarkPaid = async (billId, userId) => {
    try {
      const { data } = await axios.put(`/extra/bills/${billId}/paid/${userId}`);
      setBills(prev => prev.map(b => b._id === billId ? data : b));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a1a2e] rounded-t-3xl">
          <h3 className="text-white font-bold">💰 Bill Splitter</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)} className="text-purple-400 text-xs border border-purple-500/30 px-3 py-1 rounded-full hover:bg-purple-500/10">+ Split Bill</button>
            <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {showForm && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's this for? (e.g., Dinner)" className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-purple-400" />
              <div className="flex gap-2">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-[#1e1e30] border border-white/10 text-white px-3 py-2 rounded-xl text-sm">
                  <option>₹</option><option>$</option><option>€</option><option>£</option>
                </select>
                <input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="Total amount" className="flex-1 bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <p className="text-white/40 text-xs mb-2">Split with:</p>
                {splits.map((split, i) => (
                  <div key={split.user} className="flex items-center gap-3 mb-2">
                    <p className="text-white text-sm flex-1">{split.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-white/40 text-xs">{currency}</span>
                      <input
                        type="number"
                        value={split.amount}
                        onChange={(e) => { const n = [...splits]; n[i].amount = parseFloat(e.target.value); setSplits(n); }}
                        className="w-20 bg-white/5 border border-white/10 text-white px-2 py-1 rounded-lg text-xs text-right focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleCreate} disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                {loading ? 'Creating...' : '💰 Create Split'}
              </button>
            </div>
          )}

          {bills.length === 0 && !showForm && (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">💰</p>
              <p className="text-white/40 text-sm">No bills split yet</p>
            </div>
          )}

          {bills.map((bill) => (
            <div key={bill._id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-white font-semibold">{bill.title}</p>
                  <p className="text-purple-400 text-sm font-bold">{bill.currency}{bill.totalAmount}</p>
                </div>
                {bill.isSettled && <span className="text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded-full">✅ Settled</span>}
              </div>
              <div className="space-y-2">
                {bill.splits?.map((split) => (
                  <div key={split.user?._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {split.user?.name?.charAt(0)}
                      </div>
                      <p className="text-white text-xs">{split.user?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-white/60 text-xs">{bill.currency}{split.amount}</p>
                      {split.isPaid
                        ? <span className="text-green-400 text-xs">✅ Paid</span>
                        : split.user?._id === user._id && (
                          <button onClick={() => handleMarkPaid(bill._id, split.user._id)} className="text-xs text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full hover:bg-purple-500/10">Mark Paid</button>
                        )
                      }
                    </div>
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