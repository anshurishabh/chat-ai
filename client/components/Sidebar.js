'use client';
import { useEffect, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import ProfileModal from './ProfileModal';

export default function Sidebar({ onSelectChat }) {
  const { user, logout } = useAuthStore();
  const {
    contacts, getContacts, searchResults, searchQuery, searchUsers, clearSearch,
    selectedUser, setSelectedUser, onlineUsers,
    groups, getGroups, setSelectedGroup, selectedGroup,
    showAIChat, setShowAIChat,
    getBlockedUsers,
  } = useChatStore();

  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    getContacts();
    getGroups();
    getBlockedUsers();
  }, []);

  const isSearching = searchQuery && searchQuery.trim().length >= 2;
  const displayUsers = isSearching ? searchResults : contacts;

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    clearSearch();
    if (onSelectChat) onSelectChat();
  };

  const handleSelectGroup = (g) => {
    setSelectedGroup(g);
    if (onSelectChat) onSelectChat();
  };

  const handleSelectAI = () => {
    setShowAIChat(true);
    if (onSelectChat) onSelectChat();
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0f0f1a]">

      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-gradient-to-b from-[#1a0a2e] to-[#0f0f1a]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfile(true)}>
            <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-purple-500/50 flex-shrink-0">
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )
              }
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{user?.name}</p>
              <p className="text-green-400 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse"></span>
                Online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 relative">
            <button
              onClick={handleSelectAI}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30 flex items-center justify-center text-lg transition-all border border-green-500/30"
              title="NexChat AI"
            >
              🤖
            </button>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 text-xl transition-colors"
            >
              ⋮
            </button>
            {showMenu && (
              <div className="absolute right-0 top-11 w-52 bg-[#1e1e30] border border-white/10 rounded-2xl shadow-2xl z-30 overflow-hidden">
                <button onClick={() => { setShowProfile(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-2">
                  <span>👤</span> Edit Profile
                </button>
                <button onClick={() => { setActiveTab('groups'); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-2">
                  <span>👥</span> Groups
                </button>
                <button onClick={handleSelectAI} className="w-full text-left px-4 py-3 text-sm text-green-400 hover:bg-white/5 flex items-center gap-2">
                  <span>🤖</span> NexChat AI
                </button>
                {user?.isAdmin && (
                  <button onClick={() => { window.location.href = '/admin'; setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-yellow-400 hover:bg-white/5 flex items-center gap-2">
                    <span>👑</span> Admin Panel
                  </button>
                )}
                <div className="border-t border-white/10 my-1" />
                <button onClick={logout} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2">
                  <span>🚪</span> Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 gap-3 focus-within:border-purple-400/50 transition-colors">
          <span className="text-white/30 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => searchUsers(e.target.value)}
            placeholder="Search people..."
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="text-white/30 hover:text-white text-xs transition-colors">✕</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-2 mb-2">
        {['chats', 'groups'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === tab
                ? 'bg-purple-500 text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab === 'chats' ? 'Chats' : 'Groups'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2">

        {/* NexChat AI pinned at top */}
        {activeTab === 'chats' && !isSearching && (
          <div
            onClick={handleSelectAI}
            className={`flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all mb-1 ${
              showAIChat ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30' : 'hover:bg-white/5'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg shadow-green-500/20">
              🤖
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="text-white font-semibold text-sm">NexChat AI</p>
                <span className="text-green-400 text-[10px] font-medium">LIVE</span>
              </div>
              <p className="text-white/40 text-xs truncate">Your personal AI assistant</p>
            </div>
          </div>
        )}

        {/* Search hint */}
        {activeTab === 'chats' && !isSearching && displayUsers.length === 0 && (
          <div className="text-center py-8 px-4">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-white/60 text-sm">Search for someone to start chatting</p>
            <p className="text-white/30 text-xs mt-1">Type at least 2 characters to search</p>
          </div>
        )}

        {/* Search label */}
        {isSearching && (
          <p className="text-white/30 text-xs px-3 py-2 uppercase tracking-wider">
            Search Results ({searchResults.length})
          </p>
        )}

        {/* Users list */}
        {activeTab === 'chats' && displayUsers.map((u) => (
          <div
            key={u._id}
            onClick={() => handleSelectUser(u)}
            className={`flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all mb-1 ${
              selectedUser?._id === u._id && !showAIChat
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                : 'hover:bg-white/5'
            }`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl overflow-hidden">
                {u.avatar
                  ? <img src={u.avatar} alt="avatar" className="w-full h-full object-cover" />
                  : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                  )
                }
              </div>
              {onlineUsers && onlineUsers.includes(u._id) && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#0f0f1a]"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="text-white font-medium text-sm truncate">{u.name}</p>
                {onlineUsers && onlineUsers.includes(u._id) && (
                  <span className="text-green-400 text-[10px] flex-shrink-0">online</span>
                )}
              </div>
              <p className="text-white/40 text-xs truncate">{u.bio || u.email}</p>
            </div>
          </div>
        ))}

        {/* Groups */}
        {activeTab === 'groups' && (
          <>
            {groups.length === 0 && (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">👥</p>
                <p className="text-white/60 text-sm">No groups yet</p>
              </div>
            )}
            {groups.map((g) => (
              <div
                key={g._id}
                onClick={() => handleSelectGroup(g)}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all mb-1 ${
                  selectedGroup?._id === g._id ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' : 'hover:bg-white/5'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {g.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{g.name}</p>
                  <p className="text-white/40 text-xs">{g.members?.length} members</p>
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