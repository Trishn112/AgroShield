import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global Middlewares
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Logging Middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // API Routes
  console.log("Defining API routes...");
  
  app.get("/api/env", (req, res) => {
    res.json({ 
      nodeEnv: process.env.NODE_ENV,
      isProd,
      cwd: process.cwd(),
      distExists: require('fs').existsSync(path.join(process.cwd(), 'dist'))
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/analyze-crop", async (req, res) => {
    console.log(`Processing analyze-crop request. Body size: ${JSON.stringify(req.body).length}`);
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Image is required" });
      }

      const modelName = "gemini-1.5-flash";
      const response = await ai.models.generateContent({ 
        model: modelName,
        contents: [
          { text: "Analyze this crop image for diseases. Return JSON." },
          { inlineData: { data: image.split(',')[1], mimeType: "image/jpeg" } }
        ],
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

      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("Analysis Error:", error);
      res.status(500).json({ error: error.message || "Analysis failed" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    console.log("Processing chat request");
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const lastMessage = messages[messages.length - 1].content;
      const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const chat = ai.chats.create({ 
        model: "gemini-1.5-flash",
        config: {
          systemInstruction: "You are an expert AI agriculture consultant."
        },
        history: history
      });

      const result = await chat.sendMessageStream({ message: lastMessage });
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      for await (const chunk of result) {
        if (chunk.text) res.write(chunk.text);
      }
      res.end();
    } catch (error: any) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  const isProd = process.env.NODE_ENV === "production" || process.env.VITE_PROD === "true";
  console.log(`Starting server in ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
  console.log(`CWD: ${process.cwd()}`);
  
  if (!isProd) {
    console.log("Dev mode: Using Vite middleware");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Failed to start Vite middleware:", e);
    }
  } else {
    console.log("Prod mode: Serving static files");
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`Static files path: ${distPath}`);
    app.use(express.static(distPath));
    
    // Explicitly handle all other GET requests as SPA fallback
    app.get('*', (req, res) => {
      console.log(`Fallback for ${req.url}`);
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
