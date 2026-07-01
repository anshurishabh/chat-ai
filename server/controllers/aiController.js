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
    console.error('Smart Replies Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;
    const historyMessages = history?.map(h => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: h.content
    })) || [];
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are NexChat AI Assistant — a helpful, friendly, and smart assistant inside a chat application. Keep responses concise and conversational.' },
        ...historyMessages,
        { role: 'user', content: message }
      ],
      max_tokens: 500,
    });
    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('Groq Chat Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const translateMessage = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a translator. Return ONLY the translated text, nothing else.' },
        { role: 'user', content: `Translate to ${targetLanguage}: ${text}` }
      ],
      max_tokens: 200,
    });
    const translated = completion.choices[0].message.content.trim();
    res.json({ translated });
  } catch (error) {
    console.error('Translate Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const detectSentiment = async (req, res) => {
  try {
    const { text } = req.body;
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a sentiment analyzer. Return ONLY a JSON object like: {"sentiment": "positive", "emotion": "happy", "emoji": "😊"}' },
        { role: 'user', content: `Analyze: ${text}` }
      ],
      max_tokens: 100,
    });
    const raw = completion.choices[0].message.content.replace(/```json|```/g, '').trim();
    const data = JSON.parse(raw);
    res.json(data);
  } catch (error) {
    console.error('Sentiment Error:', error.message);
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
        { role: 'system', content: 'You are a chat summarizer. Summarize in 3-4 concise lines.' },
        { role: 'user', content: `Summarize this chat:\n${chatText}` }
      ],
      max_tokens: 200,
    });
    const summary = completion.choices[0].message.content.trim();
    res.json({ summary });
  } catch (error) {
    console.error('Summary Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const correctGrammar = async (req, res) => {
  try {
    const { text } = req.body;
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a grammar corrector. Return ONLY the corrected text, nothing else.' },
        { role: 'user', content: `Correct grammar: ${text}` }
      ],
      max_tokens: 200,
    });
    const corrected = completion.choices[0].message.content.trim();
    res.json({ corrected });
  } catch (error) {
    console.error('Grammar Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// AI Image Generation using Hugging Face
const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    console.log('Generating image for prompt:', prompt);

    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 20,
            guidance_scale: 7.5,
            width: 512,
            height: 512,
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      // Model loading hota hai pehli baar — retry karo
      if (response.status === 503) {
        return res.status(503).json({ message: 'Model is loading, please try again in 20 seconds', loading: true });
      }
      throw new Error(`HuggingFace error: ${error}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageUrl = `data:image/png;base64,${base64Image}`;

    res.json({ imageUrl, prompt });
  } catch (error) {
    console.error('Image Generation Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSmartReplies,
  chatWithAI,
  translateMessage,
  detectSentiment,
  summarizeChat,
  correctGrammar,
  generateImage
};