import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();

  const PORT = Number(process.env.PORT) || 3000;

  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VITE_PROD === "true";

  // =========================
  // GLOBAL MIDDLEWARES
  // =========================

  app.use(cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  }));

  app.use(express.json({ limit: "50mb" }));

  app.use(express.urlencoded({
    extended: true,
    limit: "50mb",
  }));

  // =========================
  // REQUEST LOGGER
  // =========================

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // =========================
  // STRIPE
  // =========================

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new (require("stripe"))(process.env.STRIPE_SECRET_KEY)
    : null;

  // =========================
  // ROUTES
  // =========================

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
    });
  });

  app.get("/api/env", (req, res) => {
    res.json({
      nodeEnv: process.env.NODE_ENV,
      isProd,
      cwd: process.cwd(),
      distExists: require("fs").existsSync(
        path.join(process.cwd(), "dist")
      ),
    });
  });

  // =========================
  // STRIPE CHECKOUT
  // =========================

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const {
        productId,
        name,
        price,
        quantity = 1,
      } = req.body;

      if (!stripe) {
        return res.status(500).json({
          error: "Stripe is not configured on server",
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],

        line_items: [
          {
            price_data: {
              currency: "inr",

              product_data: {
                name: name,
              },

              unit_amount: price * 100,
            },

            quantity: quantity,
          },
        ],

        mode: "payment",

        success_url: `${req.headers.origin}/marketplace?success=true`,

        cancel_url: `${req.headers.origin}/marketplace?canceled=true`,

        metadata: {
          productId,
        },
      });

      res.json({
        id: session.id,
      });

    } catch (error: any) {
      console.error("Stripe Error:", error);

      res.status(500).json({
        error: error.message,
      });
    }
  });

  // =========================
  // CROP ANALYSIS
  // =========================

  app.post("/api/analyze-crop", async (req, res) => {
    try {
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({
          error: "Image is required",
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",

        contents: [
          {
            text:
              "Analyze this crop image for diseases. Return JSON with disease name, symptoms, causes, treatment, and prevention.",
          },

          {
            inlineData: {
              data: image.split(",")[1],
              mimeType: "image/jpeg",
            },
          },
        ],

        config: {
          responseMimeType: "application/json",

          responseSchema: {
            type: Type.OBJECT,

            properties: {
              disease: {
                type: Type.STRING,
              },

              pathogenType: {
                type: Type.STRING,
              },

              severity: {
                type: Type.STRING,
                enum: ["low", "medium", "high"],
              },

              symptoms: {
                type: Type.STRING,
              },

              causes: {
                type: Type.STRING,
              },

              solution: {
                type: Type.OBJECT,

                properties: {
                  immediate: {
                    type: Type.STRING,
                  },

                  longTerm: {
                    type: Type.STRING,
                  },
                },

                required: ["immediate", "longTerm"],
              },

              confidence: {
                type: Type.NUMBER,
              },
            },

            required: [
              "disease",
              "pathogenType",
              "severity",
              "symptoms",
              "causes",
              "solution",
              "confidence",
            ],
          },
        },
      });

      res.json(JSON.parse(response.text || "{}"));

    } catch (error: any) {
      console.error("Analysis Error:", error);

      res.status(500).json({
        error: error.message || "Analysis failed",
      });
    }
  });

  // =========================
  // AI CHAT
  // =========================

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          error: "Messages array is required",
        });
      }

      const lastMessage =
        messages[messages.length - 1].content;

      const history = messages
        .slice(0, -1)
        .map((m: any) => ({
          role: m.role === "user" ? "user" : "model",

          parts: [
            {
              text: m.content,
            },
          ],
        }));

      const chat = ai.chats.create({
        model: "gemini-2.0-flash",

        config: {
          systemInstruction:
            "You are an expert AI agriculture consultant for Kisan Sathi. Only answer agriculture, farming, irrigation, crops, soil, livestock, and sustainability related queries.",
        },

        history,
      });

      const result =
        await chat.sendMessageStream({
          message: lastMessage,
        });

      res.setHeader(
        "Content-Type",
        "text/plain; charset=utf-8"
      );

      res.setHeader(
        "Transfer-Encoding",
        "chunked"
      );

      for await (const chunk of result) {
        if (chunk.text) {
          res.write(chunk.text);
        }
      }

      res.end();

    } catch (error: any) {
      console.error("Chat Error:", error);

      res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  });

  // =========================
  // VITE DEV SERVER
  // =========================

  if (!isProd) {
    console.log("Using Vite middleware");

    try {
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
        },

        appType: "spa",
      });

      app.use(vite.middlewares);

    } catch (e) {
      console.error("Vite Error:", e);
    }

  } else {

    // =========================
    // PRODUCTION STATIC FILES
    // =========================

    const distPath = path.join(
      process.cwd(),
      "dist"
    );

    console.log(
      `Serving static files from ${distPath}`
    );

    app.use(express.static(distPath, {
      index: false,
    }));

    app.get("*", (req, res, next) => {

      if (req.path.startsWith("/api/")) {
        return next();
      }

      res.sendFile(
        path.join(distPath, "index.html")
      );
    });
  }

  // =========================
  // START SERVER
  // =========================

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Server running on http://0.0.0.0:${PORT}`
    );
  });
}

startServer().catch((err) => {
  console.error("Server startup failed:", err);
  process.exit(1);
});
