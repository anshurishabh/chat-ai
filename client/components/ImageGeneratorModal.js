'use client';
import { useState } from 'react';
import useAIStore from '../store/useAIStore';

export default function ImageGeneratorModal({ onSend, onClose }) {
  const { generateImage, imageLoading } = useAIStore();
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setError('');
    setGeneratedImage(null);

    const result = await generateImage(prompt);

    if (!result) {
      setError('Something went wrong. Please try again.');
      return;
    }

    if (result.error === 'Service unavailable' || result.status === 'busy') {
      setError('Image generation service is busy. Please try again in 1-2 minutes.');
      setRetrying(true);
      return;
    }

    if (result.loading) {
      setError('Model is loading (first time takes ~20 seconds). Please try again!');
      setRetrying(true);
      return;
    }

    setGeneratedImage(result.imageUrl);
    setRetrying(false);
  };

  const handleSend = () => {
    if (!generatedImage) return;
    onSend({ imageUrl: generatedImage, prompt });
    onClose();
  };

  const EXAMPLE_PROMPTS = [
    'A futuristic cyberpunk city at night',
    'A cute cat astronaut in space',
    'A magical forest with glowing mushrooms',
    'A beautiful sunset over mountains',
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-[480px] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">🎨 AI Image Generator</h3>
            <p className="text-gray-400 text-xs mt-1">Type <span className="text-green-400 font-mono">/imagine</span> in chat or use this panel</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Prompt input */}
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Describe your image</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A beautiful sunset over mountains, photorealistic, 4K..."
              rows={3}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-green-400 text-sm resize-none"
            />
          </div>

          {/* Example prompts */}
          <div>
            <p className="text-gray-500 text-xs mb-2">✨ Try these:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full border border-gray-600 hover:border-green-400 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={imageLoading || !prompt.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm"
          >
            {imageLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚙️</span> Generating...
              </span>
            ) : '🎨 Generate Image'}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-3 text-red-400 text-sm">
              {error}
              {retrying && (
                <button
                  onClick={handleGenerate}
                  className="block mt-2 text-xs text-green-400 hover:underline"
                >
                  🔄 Try again
                </button>
              )}
            </div>
          )}

          {/* Generated Image */}
          {generatedImage && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-gray-700">
                <img
                  src={generatedImage}
                  alt={prompt}
                  className="w-full object-cover"
                />
              </div>
              <p className="text-gray-400 text-xs italic">"{prompt}"</p>
              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors text-sm"
                >
                  🔄 Regenerate
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-colors text-sm"
                >
                  📤 Send in Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}