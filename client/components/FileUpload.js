'use client';
import { useState, useRef } from 'react';
import axios from '../utils/axios';

export default function FileUpload({ onUpload, onClose }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const { data } = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onUpload(data);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold">Share File</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Upload Area */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-600 hover:border-green-400 rounded-xl p-8 text-center cursor-pointer transition-colors mb-4"
        >
          {preview ? (
            <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg" />
          ) : (
            <>
              <div className="text-4xl mb-2">📎</div>
              <p className="text-gray-400 text-sm">Click to select file</p>
              <p className="text-gray-500 text-xs mt-1">Images, Videos, PDFs, Audio (max 50MB)</p>
            </>
          )}
        </div>

        {selectedFile && (
          <div className="bg-gray-800 rounded-lg p-3 mb-4 flex items-center gap-3">
            <span className="text-2xl">
              {selectedFile.type.startsWith('image/') ? '🖼️' :
               selectedFile.type.startsWith('video/') ? '🎥' :
               selectedFile.type.startsWith('audio/') ? '🎵' : '📄'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{selectedFile.name}</p>
              <p className="text-gray-400 text-xs">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        )}

        <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-600 text-gray-400 rounded-xl hover:bg-gray-800 transition-colors text-sm">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="flex-1 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-colors text-sm disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}