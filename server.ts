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
  const isProd = process.env.NODE_ENV === "production" || process.env.VITE_PROD === "true";

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
  
  const stripe = process.env.STRIPE_SECRET_KEY 
    ? new (require('stripe'))(process.env.STRIPE_SECRET_KEY)
    : null;

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { productId, name, price, quantity = 1 } = req.body;
      
      if (!stripe) {
        return res.status(500).json({ error: "Stripe is not configured on the server." });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: name,
              },
              unit_amount: price * 100, // Stripe expects amount in cents/paisa
            },
            quantity: quantity,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin}/marketplace?success=true`,
        cancel_url: `${req.headers.origin}/marketplace?canceled=true`,
        metadata: {
          productId: productId,
        }
      });

      res.json({ id: session.id });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

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

  // Serve static files / Vite middleware
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
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`Prod mode: Serving static files from ${distPath}`);
    
    // Serve static files with strict routing
    app.use(express.static(distPath, { index: false }));
    
    // Explicitly handle all other non-API GET requests as SPA fallback
    app.get('*', (req, res, next) => {
      // Skip if it's an API route that wasn't matched
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      console.log(`SPA Fallback for ${req.url}`);
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
