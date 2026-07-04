'use client';
import { useState } from 'react';

const EXAMPLE_PROMPTS = [
  'A futuristic neon cyberpunk city at night, ultra realistic',
  'A cute cat astronaut floating in space, digital art',
  'A magical enchanted forest with glowing blue mushrooms',
  'A beautiful sunset over Himalayan mountains, photorealistic',
  'A dragon made of fire and ice, fantasy art',
  'A cozy coffee shop in Paris on a rainy day',
];

const STYLES = ['Realistic', 'Anime', 'Digital Art', 'Oil Painting', 'Watercolor', 'Cyberpunk', 'Fantasy'];

export default function ImageGeneratorModal({ onSend, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Realistic');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setGeneratedImage(null);

    try {
      const fullPrompt = `${prompt}, ${style} style, high quality, detailed`;
      const encodedPrompt = encodeURIComponent(fullPrompt);
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${seed}&nologo=true&enhance=true`;

      // Test if image loads
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
        setTimeout(reject, 30000); // 30 second timeout
      });

      setGeneratedImage(imageUrl);
    } catch (err) {
      setError('Generation failed. Try again with a different prompt.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!generatedImage) return;
    onSend({ imageUrl: generatedImage, prompt });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-purple-500/30 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-purple-500/10">

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a1a2e] rounded-t-3xl">
          <div>
            <h3 className="text-white font-bold text-lg">🎨 AI Image Generator</h3>
            <p className="text-purple-300 text-xs mt-0.5">Powered by Pollinations AI — Free & Fast</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Style selector */}
          <div>
            <label className="text-white/60 text-xs mb-2 block">Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    style === s
                      ? 'bg-purple-500 border-purple-500 text-white'
                      : 'border-white/20 text-white/60 hover:border-purple-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          <div>
            <label className="text-white/60 text-xs mb-2 block">Describe your image</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A beautiful sunset over mountains..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 focus:border-purple-400 text-white placeholder-white/30 px-4 py-3 rounded-2xl text-sm resize-none focus:outline-none transition-colors"
            />
          </div>

          {/* Example prompts */}
          <div>
            <p className="text-white/40 text-xs mb-2">✨ Quick ideas:</p>
            <div className="flex flex-col gap-1.5">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className="text-left text-xs text-white/50 hover:text-purple-300 hover:bg-purple-500/10 px-3 py-1.5 rounded-xl transition-colors truncate"
                >
                  → {p}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Generating... (may take 10-20s)
              </span>
            ) : '✨ Generate Image'}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* Generated image */}
          {generatedImage && (
            <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden border border-purple-500/30">
                <img src={generatedImage} alt={prompt} className="w-full object-cover" />
              </div>
              <p className="text-white/40 text-xs italic text-center">"{prompt}" — {style}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  className="flex-1 py-2.5 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-xl text-sm transition-colors"
                >
                  🔄 Regenerate
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl text-sm transition-colors"
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