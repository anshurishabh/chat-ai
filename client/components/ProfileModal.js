'use client';
import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import ConfirmModal from './ConfirmModal';
import axios from '../utils/axios';

export default function ProfileModal({ onClose, viewingUser = null }) {
  const { user, updateProfile, setTheme } = useAuthStore();
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
  const [reportReason, setReportReason] = useState('');
  const [toast, setToast] = useState('');

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatarPreview(data.url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ name, bio, avatar: avatarPreview });
    setSaving(false);
    setToast('Profile updated!');
    setTimeout(() => setToast(''), 2000);
  };

  const handleThemeToggle = () => {
    setTheme(user.theme === 'dark' ? 'light' : 'dark');
  };

  const handleBlock = async () => {
    const ok = await blockUser(targetUser._id);
    setShowBlockConfirm(false);
    if (ok) onClose();
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    await reportUser(targetUser._id, reportReason);
    setShowReportForm(false);
    setToast('Report submitted');
    setTimeout(() => { setToast(''); onClose(); }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-96 max-h-[90vh] overflow-y-auto">

        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-white font-semibold">{isOwnProfile ? 'Your Profile' : `${targetUser.name}'s Profile`}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl overflow-hidden">
              {avatarPreview || targetUser.avatar ? (
                <img src={isOwnProfile ? avatarPreview : targetUser.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                targetUser.name?.charAt(0).toUpperCase()
              )}
            </div>
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center cursor-pointer text-sm">
                {uploading ? '...' : '📷'}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
              </label>
            )}
          </div>

          {isOwnProfile ? (
            <div className="w-full mt-6 space-y-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-green-400 text-sm"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 150))}
                  rows={2}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-green-400 text-sm resize-none"
                />
                <p className="text-gray-500 text-[10px] text-right mt-1">{bio.length}/150</p>
              </div>

              <div className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded-lg">
                <p className="text-white text-sm">🎨 Theme</p>
                <button
                  onClick={handleThemeToggle}
                  className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full text-white"
                >
                  {user.theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              {toast && <p className="text-green-400 text-xs text-center">{toast}</p>}
            </div>
          ) : (
            <div className="w-full mt-6 space-y-4">
              <p className="text-white text-xl font-semibold text-center">{targetUser.name}</p>
              {targetUser.bio && <p className="text-gray-400 text-sm text-center">{targetUser.bio}</p>}
              <p className="text-gray-500 text-xs text-center">{targetUser.email}</p>
              <p className="text-gray-500 text-xs text-center">
                {targetUser.isOnline ? '🟢 Online' : `Last seen ${new Date(targetUser.lastSeen).toLocaleString()}`}
              </p>

              <div className="border-t border-gray-800 pt-4 space-y-2">
                <button
                  onClick={() => setShowReportForm(true)}
                  className="w-full py-2 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors text-sm"
                >
                  🚩 Report User
                </button>
                <button
                  onClick={() => setShowBlockConfirm(true)}
                  className="w-full py-2 border border-red-500/40 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors text-sm"
                >
                  🚫 Block User
                </button>
              </div>

              {showReportForm && (
                <div className="space-y-2">
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Why are you reporting this user?"
                    rows={2}
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 text-sm resize-none focus:outline-none focus:border-red-400"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowReportForm(false)} className="flex-1 py-2 text-xs border border-gray-700 text-gray-400 rounded-lg">Cancel</button>
                    <button onClick={handleReport} className="flex-1 py-2 text-xs bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg">Submit Report</button>
                  </div>
                </div>
              )}

              {toast && <p className="text-green-400 text-xs text-center">{toast}</p>}
            </div>
          )}
        </div>
      </div>

      {showBlockConfirm && (
        <ConfirmModal
          title={`Block ${targetUser.name}?`}
          message="They won't be able to message you and you won't see them in your contacts list anymore."
          confirmText="Block"
          danger
          onConfirm={handleBlock}
          onCancel={() => setShowBlockConfirm(false)}
        />
      )}
    </div>
  );
}