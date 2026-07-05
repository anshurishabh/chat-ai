'use client';
import { useState, useEffect } from 'react';
import axios from '../utils/axios';

export default function SecurityModal({ onClose }) {
  const [tab, setTab] = useState('2fa');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState('init'); // init | scan | verify

  useEffect(() => {
    loadDevices();
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const { data } = await axios.get('/auth/me');
      setIs2FAEnabled(data.twoFactorEnabled);
    } catch (err) {}
  };

  const loadDevices = async () => {
    try {
      const { data } = await axios.get('/auth/2fa/devices');
      setDevices(data);
    } catch (err) {}
  };

  const handleSetup2FA = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post('/auth/2fa/setup');
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('scan');
    } catch (err) {
      setMessage('Error setting up 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post('/auth/2fa/verify', { token });
      setIs2FAEnabled(true);
      setStep('init');
      setMessage('✅ 2FA enabled successfully!');
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Invalid code'));
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!token) return setMessage('Enter the 6-digit code first');
    setLoading(true);
    try {
      await axios.post('/auth/2fa/disable', { token });
      setIs2FAEnabled(false);
      setToken('');
      setMessage('✅ 2FA disabled');
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Invalid code'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    try {
      await axios.delete(`/auth/2fa/devices/${deviceId}`);
      setDevices(prev => prev.filter(d => d.deviceId !== deviceId));
    } catch (err) {}
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#1a1a2e] rounded-t-3xl">
          <h3 className="text-white font-bold">🔒 Security Settings</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-4 gap-2">
          {[
            { id: '2fa', label: '🔐 2FA' },
            { id: 'devices', label: '📱 Devices' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${tab === t.id ? 'bg-purple-500 text-white' : 'text-white/40 hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {message && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${message.startsWith('✅') ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              {message}
            </div>
          )}

          {/* 2FA Tab */}
          {tab === '2fa' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${is2FAEnabled ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">Two-Factor Authentication</p>
                    <p className={`text-xs mt-0.5 ${is2FAEnabled ? 'text-green-400' : 'text-white/40'}`}>
                      {is2FAEnabled ? '✅ Enabled — Your account is protected' : 'Adds an extra layer of security'}
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${is2FAEnabled ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
                </div>
              </div>

              {!is2FAEnabled && step === 'init' && (
                <button
                  onClick={handleSetup2FA}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-sm disabled:opacity-50"
                >
                  {loading ? 'Setting up...' : '🔐 Enable 2FA'}
                </button>
              )}

              {step === 'scan' && qrCode && (
                <div className="space-y-4">
                  <p className="text-white/60 text-xs">1. Install Google Authenticator or Authy</p>
                  <p className="text-white/60 text-xs">2. Scan this QR code:</p>
                  <div className="bg-white p-3 rounded-2xl w-fit mx-auto">
                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-white/40 text-xs mb-1">Or enter manually:</p>
                    <p className="text-white font-mono text-xs break-all">{secret}</p>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">3. Enter the 6-digit code:</label>
                    <input
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      maxLength={6}
                      placeholder="000000"
                      className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl text-center text-xl font-mono tracking-widest focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <button
                    onClick={handleVerify2FA}
                    disabled={loading || token.length !== 6}
                    className="w-full py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl text-sm disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : '✅ Verify & Enable'}
                  </button>
                </div>
              )}

              {is2FAEnabled && (
                <div className="space-y-3">
                  <label className="text-white/50 text-xs mb-1 block">Enter code to disable 2FA:</label>
                  <input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    maxLength={6}
                    placeholder="000000"
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl text-center text-xl font-mono tracking-widest focus:outline-none focus:border-red-400"
                  />
                  <button
                    onClick={handleDisable2FA}
                    disabled={loading || token.length !== 6}
                    className="w-full py-3 border border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold rounded-xl text-sm disabled:opacity-50"
                  >
                    {loading ? 'Disabling...' : '🚫 Disable 2FA'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Devices Tab */}
          {tab === 'devices' && (
            <div className="space-y-3">
              <p className="text-white/40 text-xs">Devices that have logged into your account</p>
              {devices.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-4xl mb-2">📱</p>
                  <p className="text-white/40 text-sm">No devices recorded yet</p>
                </div>
              )}
              {devices.map((device) => (
                <div key={device.deviceId} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{device.deviceName || 'Unknown Device'}</p>
                    <p className="text-white/40 text-xs">{device.browser || 'Unknown Browser'}</p>
                    <p className="text-white/30 text-xs">{new Date(device.lastActive).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.isActive && <span className="text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded-full">Active</span>}
                    <button onClick={() => handleRemoveDevice(device.deviceId)} className="text-red-400 text-xs hover:underline">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}