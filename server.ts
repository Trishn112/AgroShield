import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json({ limit: '10mb' }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Crop Disease Analysis
app.post("/api/analyze-crop", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    const modelName = "gemini-flash-latest"; // Using the standard multimodal model
    const response = await ai.models.generateContent({ 
      model: modelName,
      contents: {
        parts: [
          { text: "Analyze this crop image for diseases. Pathogen identification, specific symptoms, cause, immediate treatment, and long-term prevention. Return ONLY a JSON object." },
          { inlineData: { data: image.split(',')[1], mimeType: "image/jpeg" } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            disease: { type: Type.STRING },
            pathogenType: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
            symptoms: { type: Type.STRING },
            causes: { type: Type.STRING },
            solution: { 
              type: Type.OBJECT,
              properties: {
                immediate: { type: Type.STRING },
                longTerm: { type: Type.STRING }
              },
              required: ["immediate", "longTerm"]
            },
            confidence: { type: Type.NUMBER }
          },
          required: ["disease", "pathogenType", "severity", "symptoms", "causes", "solution", "confidence"]
        }
      }
    });

    // Clean response text in case it's wrapped in markdown
    let text = response.text || "{}";
    if (text.includes("```json")) {
      text = text.split("```json")[1].split("```")[0].trim();
    } else if (text.includes("```")) {
      text = text.split("```")[1].split("```")[0].trim();
    }

    res.json(JSON.parse(text));
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Analysis failed" });
  }
});

// Streaming Farming Advice
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const chat = ai.chats.create({ 
      model: "gemini-flash-latest",
      config: {
        systemInstruction: "You are an expert AI agriculture consultant for Kisan Sathi. You ONLY provide help related to agriculture, farming, crops, livestock, irrigation, and soil. If the user asks about anything outside of these topics, politely decline."
      },
      history: messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessageStream({ message: lastMessage });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) res.write(chunkText);
    }

    res.end();
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
