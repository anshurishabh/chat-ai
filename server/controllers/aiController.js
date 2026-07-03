const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getSmartReplies = async (req, res) => {
  try {
    const { messages } = req.body;
    const context = messages.map(m => `${m.sender}: ${m.content}`).join('\n');
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a smart reply assistant. Return ONLY a JSON array with 3 short reply options (max 8 words each). Example: ["Sure!", "Thanks for sharing", "Tell me more"]' },
        { role: 'user', content: `Conversation:\n${context}\n\nSuggest 3 smart replies:` }
      ],
      max_tokens: 100,
    });
    const text = completion.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const replies = JSON.parse(clean);
    res.json({ replies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;
    const historyMessages = history?.map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })) || [];
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are NexChat AI Assistant — helpful, friendly, smart. Keep responses concise.' },
        ...historyMessages,
        { role: 'user', content: message }
      ],
      max_tokens: 500,
    });
    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const translateMessage = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a translator. Return ONLY the translated text.' },
        { role: 'user', content: `Translate to ${targetLanguage}: ${text}` }
      ],
      max_tokens: 200,
    });
    res.json({ translated: completion.choices[0].message.content.trim() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const detectSentiment = async (req, res) => {
  try {
    const { text } = req.body;
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'Sentiment analyzer. Return ONLY JSON: {"sentiment":"positive/negative/neutral","emotion":"happy/sad/angry/excited/neutral","emoji":"😊"}' },
        { role: 'user', content: `Analyze: ${text}` }
      ],
      max_tokens: 100,
    });
    const raw = completion.choices[0].message.content.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(raw));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const summarizeChat = async (req, res) => {
  try {
    const { messages } = req.body;
    const chatText = messages.map(m => `${m.sender?.name || 'User'}: ${m.content}`).join('\n');
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'Chat summarizer. Summarize in 3-4 concise lines.' },
        { role: 'user', content: `Summarize:\n${chatText}` }
      ],
      max_tokens: 200,
    });
    res.json({ summary: completion.choices[0].message.content.trim() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const correctGrammar = async (req, res) => {
  try {
    const { text } = req.body;
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'Grammar corrector. Return ONLY corrected text.' },
        { role: 'user', content: `Correct: ${text}` }
      ],
      max_tokens: 200,
    });
    res.json({ corrected: completion.choices[0].message.content.trim() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// HuggingFace Image Generation — Fixed with better model
const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ message: 'Prompt is required' });

    // Multiple models try karo — agar ek fail ho to doosra
    const models = [
      'black-forest-labs/FLUX.1-schnell',
      'stabilityai/stable-diffusion-xl-base-1.0',
      'runwayml/stable-diffusion-v1-5'
    ];

    let imageBuffer = null;
    let lastError = '';

    for (const model of models) {
      try {
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              'Content-Type': 'application/json',
              'x-wait-for-model': 'true'
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: { num_inference_steps: 25, guidance_scale: 7.5 }
            }),
          }
        );

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('image')) {
            imageBuffer = await response.arrayBuffer();
            break;
          }
        } else {
          lastError = await response.text();
          console.log(`Model ${model} failed:`, lastError);
        }
      } catch (err) {
        lastError = err.message;
        console.log(`Model ${model} error:`, err.message);
      }
    }

    if (!imageBuffer) {
      return res.status(503).json({
        message: 'Image generation failed. All models busy. Please try again in 30 seconds.',
        loading: true,
        error: lastError
      });
    }

    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageUrl = `data:image/png;base64,${base64Image}`;
    res.json({ imageUrl, prompt });
  } catch (error) {
    console.error('Image Generation Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSmartReplies, chatWithAI, translateMessage, detectSentiment, summarizeChat, correctGrammar, generateImage };