import { GoogleGenAI } from "@google/genai";

const geminiRoleByAutopiaRole = {
  user: "user",
  assistant: "model",
};

const toGeminiContent = ({ role, content }) => {
  const geminiRole = geminiRoleByAutopiaRole[role];

  if (!geminiRole) {
    throw new TypeError(`Unsupported Autopia message role: ${role}`);
  }

  return {
    role: geminiRole,
    parts: [{ text: content }],
  };
};

const getResponseContent = (response) => {
  const content = response?.text;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("Gemini returned no text content");
  }

  return content;
};

export const createGeminiClient = ({ apiKey }) => new GoogleGenAI({ apiKey });

export const createGeminiProvider = ({ client, model }) => ({
  async generateResponse({ messages }) {
    const response = await client.models.generateContent({
      model,
      contents: messages.map(toGeminiContent),
    });

    return {
      content: getResponseContent(response),
    };
  },
});
