'use client';
import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import ConfirmModal from './ConfirmModal';
import SecurityModal from './SecurityModal';
import AnalyticsModal from './AnalyticsModal';
import axios from '../utils/axios';

export default function ProfileModal({ onClose, viewingUser = null }) {
  const { user, updateProfile, toggleTheme, theme } = useAuthStore();
  const { blockUser, reportUser } = useChatStore();

  const isOwnProfile = !viewingUser;
  const targetUser = viewingUser || user;

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [toast, setToast] = useState('');

  const isLight = theme === 'light';

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axios.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAvatarPreview(data.url);
    } catch (err) {
      showToast('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await updateProfile({ name, bio, avatar: avatarPreview });
    setSaving(false);
    if (ok) showToast('✅ Profile updated!');
  };

  const handleBlock = async () => {
    await blockUser(targetUser._id);
    setShowBlockConfirm(false);
    onClose();
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    await reportUser(targetUser._id, reportReason);
    setShowReportForm(false);
    showToast('✅ Report submitted');
    setTimeout(onClose, 1500);
  };

  const cardBg = isLight ? 'bg-white border-gray-200' : 'bg-[#1a1a2e] border-white/10';
  const textPrimary = isLight ? 'text-gray-900' : 'text-white';
  const textSecondary = isLight ? 'text-gray-500' : 'text-white/50';
  const inputBg = isLight ? 'bg-gray-100 border-gray-200 text-gray-900' : 'bg-white/5 border-white/10 text-white';

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`${cardBg} border rounded-3xl w-full max-w-sm max-h-[90vh] overflow-y-auto`}>

          {/* Header */}
          <div className={`p-5 border-b ${isLight ? 'border-gray-100' : 'border-white/10'} flex justify-between items-center sticky top-0 ${isLight ? 'bg-white' : 'bg-[#1a1a2e]'} rounded-t-3xl`}>
            <h3 className={`${textPrimary} font-bold`}>{isOwnProfile ? 'My Profile' : `${targetUser.name}`}</h3>
            <button onClick={onClose} className={`${textSecondary} hover:${textPrimary}`}>✕</button>
          </div>

          {toast && (
            <div className="mx-5 mt-4 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-xl text-sm text-center">
              {toast}
            </div>
          )}

          <div className="p-5">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-purple-500/30">
                  {(isOwnProfile ? avatarPreview : targetUser.avatar)
                    ? <img src={isOwnProfile ? avatarPreview : targetUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl">
                        {targetUser.name?.charAt(0).toUpperCase()}
                      </div>
                  }
                </div>
                {isOwnProfile && (
                  <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-500 hover:bg-purple-400 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors">
                    {uploading ? <span className="text-white text-xs animate-spin">⚙️</span> : <span className="text-white text-sm">📷</span>}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
                  </label>
                )}
              </div>
              {!isOwnProfile && (
                <div className="mt-3 text-center">
                  <p className={`font-bold text-lg ${textPrimary}`}>{targetUser.name}</p>
                  {targetUser.bio && <p className={`text-sm mt-1 ${textSecondary}`}>{targetUser.bio}</p>}
                  {/* Email HIDE — sirf online status dikhao */}
                  <p className={`text-xs mt-1 ${textSecondary}`}>
                    {targetUser.isOnline ? '🟢 Online' : `Last seen ${new Date(targetUser.lastSeen).toLocaleString()}`}
                  </p>
                  <p className={`text-xs mt-0.5 ${textSecondary}`}>
                    Member since {new Date(targetUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {isOwnProfile ? (
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className={`text-xs mb-1 block ${textSecondary}`}>Display Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full ${inputBg} px-4 py-3 rounded-2xl border text-sm focus:outline-none focus:border-purple-400 transition-colors`}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className={`text-xs mb-1 block ${textSecondary}`}>Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 150))}
                    rows={2}
                    className={`w-full ${inputBg} px-4 py-3 rounded-2xl border text-sm focus:outline-none focus:border-purple-400 resize-none transition-colors`}
                  />
                  <p className={`text-right text-xs mt-0.5 ${textSecondary}`}>{bio.length}/150</p>
                </div>

                {/* Theme toggle */}
                <div className={`flex items-center justify-between ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border rounded-2xl px-4 py-3`}>
                  <div>
                    <p className={`text-sm font-medium ${textPrimary}`}>{isLight ? '☀️ Light Mode' : '🌙 Dark Mode'}</p>
                    <p className={`text-xs ${textSecondary}`}>Switch app theme</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`w-12 h-6 rounded-full transition-all relative ${isLight ? 'bg-purple-500' : 'bg-white/20'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${isLight ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowSecurity(true)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm transition-colors ${isLight ? 'bg-gray-50 border-gray-200 text-gray-700 hover:border-purple-400' : 'bg-white/5 border-white/10 text-white hover:border-purple-400'}`}
                  >
                    🔒 Security
                  </button>
                  <button
                    onClick={() => setShowAnalytics(true)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm transition-colors ${isLight ? 'bg-gray-50 border-gray-200 text-gray-700 hover:border-purple-400' : 'bg-white/5 border-white/10 text-white hover:border-purple-400'}`}
                  >
                    📊 Analytics
                  </button>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              /* Other user's profile — email completely hidden */
              <div className="space-y-3 mt-2">
                <button onClick={() => setShowReportForm(true)} className={`w-full py-3 rounded-2xl border text-sm transition-colors ${isLight ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>
                  🚩 Report User
                </button>
                <button onClick={() => setShowBlockConfirm(true)} className="w-full py-3 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/5 text-sm transition-colors">
                  🚫 Block User
                </button>

                {showReportForm && (
                  <div className="space-y-2">
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Why are you reporting this user?"
                      rows={2}
                      className={`w-full ${inputBg} px-3 py-2 rounded-xl border text-sm resize-none focus:outline-none focus:border-red-400`}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowReportForm(false)} className={`flex-1 py-2 text-xs border ${isLight ? 'border-gray-200 text-gray-500' : 'border-white/10 text-white/40'} rounded-xl`}>Cancel</button>
                      <button onClick={handleReport} className="flex-1 py-2 text-xs bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl">Submit</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showBlockConfirm && (
        <ConfirmModal
          title={`Block ${targetUser.name}?`}
          message="They won't be able to message you and won't appear in your contacts."
          confirmText="Block"
          danger
          onConfirm={handleBlock}
          onCancel={() => setShowBlockConfirm(false)}
        />
      )}

      {showSecurity && <SecurityModal onClose={() => setShowSecurity(false)} />}
      {showAnalytics && <AnalyticsModal onClose={() => setShowAnalytics(false)} />}
    </>
  );
}