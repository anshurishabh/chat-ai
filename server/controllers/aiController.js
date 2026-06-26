const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const getSmartReplies = async (req, res) => {
  try {
    const { messages } = req.body;

    const context = messages
      .map((m) => `${m.sender}: ${m.content}`)
      .join("\n");

    const prompt = `Based on this conversation, suggest 3 short smart reply options (max 8 words each). Return ONLY a JSON array like:
["reply1","reply2","reply3"]

Conversation:
${context}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = result.text;
    const clean = text.replace(/```json|```/g, "").trim();
    const replies = JSON.parse(clean);

    res.json({ replies });
  } catch (error) {
    console.error("Smart Replies Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const chatWithAI = async (req, res) => {
  try {
    console.log(req.body);
    console.log(
      "GEMINI KEY:",
      process.env.GEMINI_API_KEY ? "Found" : "NOT FOUND"
    );

    const { message, history } = req.body;

    const historyText =
      history?.map((h) => `${h.role}: ${h.content}`).join("\n") || "";

    const prompt = `You are NexChat AI Assistant — a helpful, friendly, and smart assistant inside a chat application.

Keep responses concise and conversational.

${historyText ? `Previous conversation:\n${historyText}\n` : ""}

User: ${message}
Assistant:`;

    console.log("before");

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log("after");

    const reply = result.text;

    console.log(reply);

    res.json({ reply });
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const translateMessage = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text.

Text:
${text}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const translated = result.text.trim();

    res.json({ translated });
  } catch (error) {
    console.error("Translate Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const detectSentiment = async (req, res) => {
  try {
    const { text } = req.body;

    const prompt = `Analyze the sentiment and emotion of this message.

Return ONLY JSON:

{
  "sentiment":"positive",
  "emotion":"happy",
  "emoji":"😊"
}

Message:
${text}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const raw = result.text.replace(/```json|```/g, "").trim();

    const data = JSON.parse(raw);

    res.json(data);
  } catch (error) {
    console.error("Sentiment Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const summarizeChat = async (req, res) => {
  try {
    const { messages } = req.body;

    const chatText = messages
      .map((m) => `${m.sender?.name || "User"}: ${m.content}`)
      .join("\n");

    const prompt = `Summarize this chat in 3-4 lines.

Conversation:
${chatText}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const summary = result.text.trim();

    res.json({ summary });
  } catch (error) {
    console.error("Summary Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const correctGrammar = async (req, res) => {
  try {
    const { text } = req.body;

    const prompt = `Correct grammar and spelling.

Return ONLY corrected text.

Text:
${text}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const corrected = result.text.trim();

    res.json({ corrected });
  } catch (error) {
    console.error("Grammar Error:", error);
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
};