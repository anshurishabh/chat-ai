'use client';
import { useState, useRef } from 'react';
import axios from '../utils/axios';

export default function VoiceRecorder({ onUpload, onClose }) {
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const audioBlob = useRef(null);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        audioBlob.current = new Blob(audioChunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob.current);
        setAudioUrl(url);
        setRecorded(true);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (error) {
      console.error('Microphone error:', error);
      alert('Microphone access denied!');
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const handleSend = async () => {
    if (!audioBlob.current) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob.current, 'voice-message.webm');

      const { data } = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onUpload({ ...data, type: 'audio' });
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-80">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-semibold">Voice Message</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Recording Indicator */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl ${recording ? 'bg-red-500/20 animate-pulse' : 'bg-gray-800'}`}>
            🎤
          </div>

          {recording && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-red-400 font-mono text-lg">{formatTime(duration)}</p>
            </div>
          )}

          {audioUrl && !recording && (
            <audio controls src={audioUrl} className="w-full mt-2" />
          )}

          {/* Buttons */}
          <div className="flex gap-3 w-full">
            {!recording && !recorded && (
              <button
                onClick={startRecording}
                className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-colors"
              >
                🎙️ Start Recording
              </button>
            )}

            {recording && (
              <button
                onClick={stopRecording}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
              >
                ⏹️ Stop
              </button>
            )}

            {recorded && (
              <>
                <button
                  onClick={() => { setRecorded(false); setAudioUrl(null); setDuration(0); }}
                  className="flex-1 py-3 border border-gray-600 text-gray-400 rounded-xl hover:bg-gray-800 transition-colors text-sm"
                >
                  🔄 Re-record
                </button>
                <button
                  onClick={handleSend}
                  disabled={uploading}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-colors text-sm disabled:opacity-50"
                >
                  {uploading ? 'Sending...' : '📤 Send'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}