import axios from 'axios';
import { Event } from '../database/NativeDatabase';

export const redactPII = (text: string): string => {
  let redacted = text.replace(/\d{8,}/g, '[REDACTED]');
  const filters = ["OTP", "Password", "Verification", "PIN"];
  filters.forEach(filter => {
    const regex = new RegExp(filter, 'gi');
    redacted = redacted.replace(regex, '[FILTERED]');
  });
  return redacted;
};

export const fetchModels = async (apiKey: string): Promise<string[]> => {
  try {
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    return response.data.models
      .filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
      .map((m: any) => m.name.replace('models/', ''));
  } catch (error) {
    console.error('Fetch Models Error:', error);
    return ['gemini-1.5-flash', 'gemini-1.5-pro'];
  }
};

export const generateInsights = async (events: Event[], apiKey: string, modelName: string, customPrompt: string): Promise<string> => {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const sanitizedEvents = events.map(event => {
    const sanitized = { ...event };
    if (sanitized.comment) sanitized.comment = redactPII(sanitized.comment);
    if (sanitized.merchant) sanitized.merchant = redactPII(sanitized.merchant);
    if (sanitized.content) sanitized.content = redactPII(sanitized.content);
    return sanitized;
  });

  const prompt = `
    ${customPrompt}
    
    Events:
    ${JSON.stringify(sanitizedEvents, null, 2)}
    
    Format: Return as a plain text string with 3 bullet points.
  `;
  
  try {
    const response = await axios.post(geminiUrl, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    return response.data.candidates[0].content.parts[0].text;
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || error.message);
  }
};
