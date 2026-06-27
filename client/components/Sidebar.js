'use client';
import { useEffect, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { users, getUsers, selectedUser, setSelectedUser, onlineUsers, groups, getGroups, setSelectedGroup, selectedGroup } = useChatStore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('chats');

  useEffect(() => {
    getUsers();
    getGroups();
  }, []);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-black font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{user?.name}</p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-green-400 text-xs">Online</p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-gray-800"
            title="Logout"
          >
            🚪
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-gray-800 text-white text-sm pl-9 pr-4 py-2 rounded-xl border border-gray-700 focus:outline-none focus:border-green-400 transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-3 text-xs font-semibold transition-colors ${activeTab === 'chats' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-white'}`}
        >
          💬 Chats
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-3 text-xs font-semibold transition-colors ${activeTab === 'groups' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-white'}`}
        >
          👥 Groups
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' && (
          <>
            {filteredUsers.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-8">No users found</div>
            )}
            {filteredUsers.map((u) => (
              <div
                key={u._id}
                onClick={() => setSelectedUser(u)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800 transition-all ${selectedUser?._id === u._id ? 'bg-gray-800 border-l-2 border-green-400' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  {onlineUsers.includes(u._id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{u.name}</p>
                  <p className="text-gray-400 text-xs truncate">
                    {onlineUsers.includes(u._id) ? '🟢 Online' : '⚫ Offline'}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'groups' && (
          <>
            {groups.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-8">No groups yet</div>
            )}
            {groups.map((g) => (
              <div
                key={g._id}
                onClick={() => setSelectedGroup(g)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800 transition-all ${selectedGroup?._id === g._id ? 'bg-gray-800 border-l-2 border-green-400' : ''}`}
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                  {g.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{g.name}</p>
                  <p className="text-gray-400 text-xs">{g.members?.length} members</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}