import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
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
  // LOGGER
  // =========================

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // =========================
  // STRIPE
  // =========================

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new (require("stripe"))(
        process.env.STRIPE_SECRET_KEY
      )
    : null;

  // =========================
  // AI CACHE
  // =========================

  const aiCache = new Map<
    string,
    {
      data: any;
      timestamp: number;
    }
  >();

  const CACHE_TTL = 1000 * 60 * 60;

  const getCachedResponse = (key: string) => {
    const cached = aiCache.get(key);

    if (
      cached &&
      Date.now() - cached.timestamp <
        CACHE_TTL
    ) {
      console.log(`Cache hit: ${key}`);
      return cached.data;
    }

    return null;
  };

  const setCachedResponse = (
    key: string,
    data: any
  ) => {
    aiCache.set(key, {
      data,
      timestamp: Date.now(),
    });

    if (aiCache.size > 500) {
      const firstKey =
        aiCache.keys().next().value;

      if (firstKey) {
        aiCache.delete(firstKey);
      }
    }
  };

  // =========================
  // SIMPLE RATE LIMIT
  // =========================

  let lastRequestTime = 0;

  const MIN_REQUEST_INTERVAL = 3000;

  const waitIfBusy = async () => {
    const now = Date.now();

    const diff = now - lastRequestTime;

    if (diff < MIN_REQUEST_INTERVAL) {
      const delay =
        MIN_REQUEST_INTERVAL - diff;

      console.log(
        `Rate limiting ${delay}ms`
      );

      await new Promise(resolve =>
        setTimeout(resolve, delay)
      );
    }

    lastRequestTime = Date.now();
  };

  // =========================
  // HEALTH
  // =========================

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
    });
  });

  // =========================
  // ENV DEBUG
  // =========================

  app.get("/api/env", (req, res) => {
    res.json({
      nodeEnv: process.env.NODE_ENV,
      isProd,
      hasGeminiKey:
        !!process.env.GEMINI_API_KEY,
      hasStripeKey:
        !!process.env.STRIPE_SECRET_KEY,
    });
  });

  // =========================
  // STRIPE CHECKOUT
  // =========================

  app.post(
    "/api/create-checkout-session",
    async (req, res) => {
      try {
        const {
          productId,
          name,
          price,
          quantity = 1,
        } = req.body;

        if (!stripe) {
          return res.status(500).json({
            error:
              "Stripe is not configured",
          });
        }

        const session =
          await stripe.checkout.sessions.create({
            payment_method_types: [
              "card",
            ],

            line_items: [
              {
                price_data: {
                  currency: "inr",

                  product_data: {
                    name,
                  },

                  unit_amount:
                    Number(price) * 100,
                },

                quantity,
              },
            ],

            mode: "payment",

            success_url:
              `${req.headers.origin}/marketplace?success=true`,

            cancel_url:
              `${req.headers.origin}/marketplace?canceled=true`,

            metadata: {
              productId,
            },
          });

        res.json({
          id: session.id,
        });

      } catch (error: any) {
        console.error(
          "Stripe Error:",
          error
        );

        res.status(500).json({
          error:
            error.message ||
            "Stripe error",
        });
      }
    }
  );

  // =========================
  // IRRIGATION AI
  // =========================

  app.post(
    "/api/irrigation",
    async (req, res) => {
      try {
        const { crop } = req.body;

        if (!crop) {
          return res.status(400).json({
            error:
              "Crop name is required",
          });
        }

        const cacheKey =
          `irrigation_${crop.toLowerCase()}`;

        const cached =
          getCachedResponse(cacheKey);

        if (cached) {
          return res.json(cached);
        }

        await waitIfBusy();

        const response =
          await ai.models.generateContent({
            model: "gemini-2.0-flash",

            contents:
              `Provide agricultural optimization parameters for crop "${crop}" in valid JSON format with:
name,
moisture,
temp,
cloud,
wind,
description`,

            config: {
              responseMimeType:
                "application/json",
            },
          });

        const text =
          response.text || "{}";

        const data = JSON.parse(text);

        setCachedResponse(
          cacheKey,
          data
        );

        res.json(data);

      } catch (error: any) {
        console.error(
          "Irrigation AI Error:",
          error
        );

        res.status(500).json({
          error:
            error.message ||
            "Irrigation AI failed",
        });
      }
    }
  );

  // =========================
  // CROP ANALYSIS
  // =========================

  app.post(
    "/api/analyze-crop",
    async (req, res) => {
      try {
        const { image } = req.body;

        if (!image) {
          return res.status(400).json({
            error:
              "Image is required",
          });
        }

        await waitIfBusy();

        const response =
          await ai.models.generateContent({
            model: "gemini-2.0-flash",

            contents: [
              {
                text:
                  "Analyze this crop image for disease and return valid JSON.",
              },

              {
                inlineData: {
                  data:
                    image.split(",")[1],
                  mimeType:
                    "image/jpeg",
                },
              },
            ],

            config: {
              responseMimeType:
                "application/json",

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
                    enum: [
                      "low",
                      "medium",
                      "high",
                    ],
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

                    required: [
                      "immediate",
                      "longTerm",
                    ],
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

        const text =
          response.text || "{}";

        res.json(JSON.parse(text));

      } catch (error: any) {
        console.error(
          "Analysis Error:",
          error
        );

        res.status(500).json({
          error:
            error.message ||
            "Analysis failed",
        });
      }
    }
  );

  // =========================
  // AI CHAT
  // =========================

  app.post(
    "/api/chat",
    async (req, res) => {
      try {
        const { messages } = req.body;

        if (
          !messages ||
          !Array.isArray(messages)
        ) {
          return res.status(400).json({
            error:
              "Messages array required",
          });
        }

        await waitIfBusy();

        const history = messages
          .slice(0, -1)
          .map((m: any) => ({
            role:
              m.role === "user"
                ? "user"
                : "model",

            parts: [
              {
                text: m.content,
              },
            ],
          }));

        const lastMessage =
          messages[messages.length - 1]
            .content;

        const chat =
          ai.chats.create({
            model:
              "gemini-2.0-flash",

            config: {
              systemInstruction:
                "You are an expert AI agriculture consultant for Kisan Sathi.",
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

        for await (const chunk of result) {
          if (chunk.text) {
            res.write(chunk.text);
          }
        }

        res.end();

      } catch (error: any) {
        console.error(
          "Chat Error:",
          error
        );

        res.status(500).json({
          error:
            error.message ||
            "Chat failed",
        });
      }
    }
  );

  // =========================
  // DEV MODE
  // =========================

  if (!isProd) {
    try {
      const vite =
        await createViteServer({
          server: {
            middlewareMode: true,
          },

          appType: "spa",
        });

      app.use(vite.middlewares);

    } catch (e) {
      console.error(
        "Vite Error:",
        e
      );
    }

  } else {

    // =========================
    // PROD STATIC FILES
    // =========================

    const distPath = path.join(
      process.cwd(),
      "dist"
    );

    app.use(
      express.static(distPath, {
        index: false,
      })
    );

    app.get(
      "*",
      (req, res, next) => {
        if (
          req.path.startsWith("/api/")
        ) {
          return next();
        }

        res.sendFile(
          path.join(
            distPath,
            "index.html"
          )
        );
      }
    );
  }

  // =========================
  // START SERVER
  // =========================

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Server running on port ${PORT}`
    );
  });
}

startServer().catch(err => {
  console.error(
    "Server startup failed:",
    err
  );

  process.exit(1);
});
