import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const analyzeCropDisease = async (imageBase64: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Analyze this crop image for diseases. Provide exact and highly specific details. Identify the pathogen, describe the specific symptoms observed, state the primary cause, and provide both immediate treatment actions and long-term prevention strategies." },
          { inlineData: { data: imageBase64.split(',')[1], mimeType: "image/jpeg" } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          disease: { type: Type.STRING, description: "Official name of the disease or pest" },
          pathogenType: { type: Type.STRING, description: "Type of pathogen: Fungal, Bacterial, Viral, or Pest" },
          severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
          symptoms: { type: Type.STRING, description: "Detailed description of symptoms seen in the image" },
          causes: { type: Type.STRING, description: "Environmental or biological causes of the problem" },
          solution: { 
            type: Type.OBJECT,
            properties: {
              immediate: { type: Type.STRING, description: "Steps to take right now to stop the spread" },
              longTerm: { type: Type.STRING, description: "Prevention and management for the future" }
            },
            required: ["immediate", "longTerm"]
          },
          confidence: { type: Type.NUMBER }
        },
        required: ["disease", "pathogenType", "severity", "symptoms", "causes", "solution", "confidence"]
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
      systemInstruction: "You are an expert AI agriculture consultant for Kisan Sathi. Provide helpful, accurate, and sustainable farming advice."
    }
  });

  return response.text;
};
