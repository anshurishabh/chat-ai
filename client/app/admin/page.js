'use client';
import { useEffect, useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import axios from '../../utils/axios';

export default function AdminPage() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user?.isAdmin) {
      window.location.href = '/';
      return;
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/auth/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleDelete = async (userId, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/auth/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      showToast(`✅ ${name} deleted`);
    } catch (err) {
      showToast(`❌ Error: ${err.response?.data?.message || 'Failed'}`);
    }
  };

  const handleToggleAdmin = async (userId, name, currentStatus) => {
    try {
      await axios.put(`/auth/admin/users/${userId}/toggle-admin`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isAdmin: !u.isAdmin } : u));
      showToast(`✅ ${name} ${!currentStatus ? 'promoted to' : 'removed from'} admin`);
    } catch (err) {
      showToast(`❌ Error`);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!user?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.href = '/'} className="text-gray-400 hover:text-white text-sm border border-gray-700 px-3 py-1 rounded-full">
            ← Back
          </button>
          <h1 className="text-white font-bold text-lg">👑 Admin Panel</h1>
        </div>
        <div className="text-gray-400 text-sm">{users.length} total users</div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-600 text-white px-6 py-3 rounded-full shadow-2xl z-50 text-sm">
          {toast}
        </div>
      )}

      <div className="max-w-5xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{users.length}</p>
            <p className="text-gray-400 text-sm">Total Users</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{users.filter(u => u.isOnline).length}</p>
            <p className="text-gray-400 text-sm">Online Now</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{users.filter(u => u.isAdmin).length}</p>
            <p className="text-gray-400 text-sm">Admins</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full bg-gray-900 border border-gray-800 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-green-400"
          />
        </div>

        {/* Users table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading users...</div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-4 py-3 text-gray-400 text-xs uppercase">User</th>
                  <th className="px-4 py-3 text-gray-400 text-xs uppercase">Email</th>
                  <th className="px-4 py-3 text-gray-400 text-xs uppercase">Joined</th>
                  <th className="px-4 py-3 text-gray-400 text-xs uppercase">Status</th>
                  <th className="px-4 py-3 text-gray-400 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                          {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{u.name}</p>
                          {u.isAdmin && <span className="text-yellow-400 text-[10px]">👑 Admin</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{u.email}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.isOnline ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                        {u.isOnline ? '🟢 Online' : '⚫ Offline'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u._id !== user._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleAdmin(u._id, u.name, u.isAdmin)}
                            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                              u.isAdmin
                                ? 'border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10'
                                : 'border-gray-600 text-gray-400 hover:text-yellow-400 hover:border-yellow-500/40'
                            }`}
                          >
                            {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => handleDelete(u._id, u.name)}
                            className="text-xs px-3 py-1 rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">You</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No users found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}