import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const analyzeCropDisease = async (imageBase64: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Analyze this crop image for diseases. Provide the disease name, severity (low, medium, high), treatment steps, and a confidence score." },
          { inlineData: { data: imageBase64.split(',')[1], mimeType: "image/jpeg" } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          disease: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
          treatment: { type: Type.STRING },
          confidence: { type: Type.NUMBER }
        },
        required: ["disease", "severity", "treatment", "confidence"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const getFarmingAdvice = async (query: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: query,
    config: {
      systemInstruction: "You are an expert AI agriculture consultant for AgroShield AI. Provide helpful, accurate, and sustainable farming advice."
    }
  });

  return response.text;
};
