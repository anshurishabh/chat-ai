'use client';
import { useEffect, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import ProfileModal from './ProfileModal';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const {
    contacts, getContacts, searchResults, searchQuery, searchUsers, clearSearch,
    selectedUser, setSelectedUser, onlineUsers,
    groups, getGroups, setSelectedGroup, selectedGroup,
    blockedUsers, getBlockedUsers,
    showAIChat, setShowAIChat,
  } = useChatStore();

  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    getContacts();
    getGroups();
    getBlockedUsers();
  }, []);

  const isSearching = searchQuery.length >= 2;
  const displayUsers = isSearching ? searchResults : contacts;

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="w-[360px] h-screen bg-[#111b21] border-r border-[#222d34] flex flex-col">

      {/* Header */}
      <div className="px-4 py-3 bg-[#202c33] flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setShowProfile(true)}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-black font-bold text-lg overflow-hidden flex-shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              : user?.name?.charAt(0).toUpperCase()
            }
          </div>
          <span className="text-white font-semibold text-sm">{user?.name}</span>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowAIChat(true)}
            className="w-9 h-9 rounded-full hover:bg-[#2a3942] flex items-center justify-center text-[#8696a0] hover:text-green-400 transition-colors"
            title="NexChat AI"
          >
            🤖
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full hover:bg-[#2a3942] flex items-center justify-center text-[#8696a0] text-xl"
          >
            ⋮
          </button>
          {showMenu && (
            <div className="absolute right-0 top-11 w-52 bg-[#233138] border border-[#2a3942] rounded-xl shadow-2xl z-30 overflow-hidden">
              <button onClick={() => { setShowProfile(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#2a3942]">👤 Profile</button>
              <button onClick={() => { setActiveTab('groups'); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#2a3942]">👥 Groups</button>
              <button onClick={() => { setShowAIChat(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-green-400 hover:bg-[#2a3942]">🤖 NexChat AI</button>
              {user?.isAdmin && (
                <button onClick={() => { window.location.href = '/admin'; setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-yellow-400 hover:bg-[#2a3942]">👑 Admin Panel</button>
              )}
              <div className="border-t border-[#2a3942]" />
              <button onClick={logout} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-[#2a3942]">🚪 Logout</button>
            </div>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2 bg-[#111b21]">
        <div className="flex items-center bg-[#202c33] rounded-full px-4 py-2 gap-3">
          <span className="text-[#8696a0] text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => searchUsers(e.target.value)}
            placeholder="Search or start new chat"
            className="flex-1 bg-transparent text-white text-sm placeholder-[#8696a0] focus:outline-none"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="text-[#8696a0] hover:text-white text-sm">✕</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#222d34]">
        {['chats', 'groups'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === tab
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-[#8696a0] hover:text-white'
            }`}
          >
            {tab === 'chats' ? '💬 Chats' : '👥 Groups'}
          </button>
        ))}
      </div>

      {/* NexChat AI entry — always top of chats */}
      {activeTab === 'chats' && (
        <div
          onClick={() => setShowAIChat(true)}
          className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#202c33] transition-colors ${showAIChat ? 'bg-[#2a3942]' : ''}`}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-2xl flex-shrink-0">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <p className="text-white text-sm font-semibold">NexChat AI</p>
              <span className="text-[#8696a0] text-[11px]">Always on</span>
            </div>
            <p className="text-[#8696a0] text-xs truncate">Ask me anything...</p>
          </div>
        </div>
      )}

      {/* Divider if searching */}
      {isSearching && (
        <div className="px-4 py-1 bg-[#202c33]">
          <p className="text-[#8696a0] text-xs uppercase tracking-wider">Search Results</p>
        </div>
      )}

      {/* Users / Groups list */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' && (
          <>
            {displayUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#8696a0] text-sm">
                  {isSearching ? 'No users found' : 'Search for someone to start a chat'}
                </p>
              </div>
            )}
            {displayUsers.map((u) => (
              <div
                key={u._id}
                onClick={() => { setSelectedUser(u); clearSearch(); }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#202c33] transition-colors ${selectedUser?._id === u._id && !showAIChat ? 'bg-[#2a3942]' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                    {u.avatar
                      ? <img src={u.avatar} alt="avatar" className="w-full h-full object-cover" />
                      : u.name?.charAt(0).toUpperCase()
                    }
                  </div>
                  {onlineUsers.includes(u._id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#111b21]"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 border-b border-[#222d34] pb-3">
                  <div className="flex justify-between items-baseline">
                    <p className="text-white text-sm font-medium truncate">{u.name}</p>
                    <span className="text-[#8696a0] text-[11px] flex-shrink-0 ml-2">
                      {onlineUsers.includes(u._id) ? '🟢' : ''}
                    </span>
                  </div>
                  <p className="text-[#8696a0] text-xs truncate">{u.email}</p>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'groups' && (
          <>
            {groups.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#8696a0] text-sm">No groups yet</p>
              </div>
            )}
            {groups.map((g) => (
              <div
                key={g._id}
                onClick={() => setSelectedGroup(g)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#202c33] transition-colors ${selectedGroup?._id === g._id ? 'bg-[#2a3942]' : ''}`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {g.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 border-b border-[#222d34] pb-3">
                  <p className="text-white text-sm font-medium truncate">{g.name}</p>
                  <p className="text-[#8696a0] text-xs">{g.members?.length} members</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}