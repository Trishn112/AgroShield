import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
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
      Date.now() - cached.timestamp < CACHE_TTL
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
      const firstKey = aiCache.keys().next().value;

      if (firstKey) {
        aiCache.delete(firstKey);
      }
    }
  };

  // =========================
  // RATE LIMITER
  // =========================

  let lastRequestTime = 0;

  const MIN_REQUEST_INTERVAL = 2000;

  const waitIfBusy = async () => {
    const now = Date.now();

    const diff = now - lastRequestTime;

    if (diff < MIN_REQUEST_INTERVAL) {
      const delay =
        MIN_REQUEST_INTERVAL - diff;

      console.log(
        `Rate limit delay: ${delay}ms`
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
      cwd: process.cwd(),
      hasOpenAIKey:
        !!process.env.OPENAI_API_KEY,
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
              "Stripe is not configured on server",
          });
        }

        const session =
          await stripe.checkout.sessions.create({
            payment_method_types: ["card"],

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
            "Stripe session failed",
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
            error: "Crop is required",
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
          await openai.chat.completions.create({
            model: "gpt-4o-mini",

            messages: [
              {
                role: "system",

                content:
                  "You are an agriculture expert. Return crop optimization data in JSON format.",
              },

              {
                role: "user",

                content:
                  `Provide irrigation parameters for crop: ${crop}`,
              },
            ],

            response_format: {
              type: "json_object",
            },
          });

        const content =
          response.choices[0].message.content ||
          "{}";

        const data = JSON.parse(content);

        setCachedResponse(cacheKey, data);

        res.json(data);

      } catch (error: any) {
        console.error(
          "Irrigation AI Error:",
          error
        );

        if (error.status === 429) {
          return res.status(429).json({
            error:
              "AI engine busy. Please wait.",
          });
        }

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
            error: "Image is required",
          });
        }

        await waitIfBusy();

        const response =
          await openai.chat.completions.create({
            model: "gpt-4o-mini",

            messages: [
              {
                role: "system",

                content:
                  `Analyze crop disease images and return valid JSON with:
disease,
pathogenType,
severity,
symptoms,
causes,
solution {
 immediate,
 longTerm
},
confidence`,
              },

              {
                role: "user",

                content: [
                  {
                    type: "text",

                    text:
                      "Analyze this crop image",
                  },

                  {
                    type: "image_url",

                    image_url: {
                      url: image.startsWith("data:")
                        ? image
                        : `data:image/jpeg;base64,${image}`,
                    },
                  },
                ],
              },
            ],

            response_format: {
              type: "json_object",
            },
          });

        const content =
          response.choices[0].message.content ||
          "{}";

        res.json(JSON.parse(content));

      } catch (error: any) {
        console.error(
          "Crop Analysis Error:",
          error
        );

        if (error.status === 429) {
          return res.status(429).json({
            error:
              "AI engine busy. Please wait.",
          });
        }

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

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;

      if (
        !messages ||
        !Array.isArray(messages)
      ) {
        return res.status(400).json({
          error:
            "Messages array is required",
        });
      }

      await waitIfBusy();

      const history = messages.map(
        (m: any) => ({
          role:
            m.role === "user"
              ? "user"
              : "assistant",

          content: m.content,
        })
      );

      const stream =
        await openai.chat.completions.create({
          model: "gpt-4o-mini",

          messages: [
            {
              role: "system",

              content:
                "You are an expert AI agriculture consultant for Kisan Sathi.",
            },

            ...history,
          ],

          stream: true,
        });

      res.setHeader(
        "Content-Type",
        "text/plain; charset=utf-8"
      );

      for await (const chunk of stream) {
        const content =
          chunk.choices[0]?.delta?.content ||
          "";

        if (content) {
          res.write(content);
        }
      }

      res.end();

    } catch (error: any) {
      console.error(
        "Chat Error:",
        error
      );

      if (error.status === 429) {
        if (!res.headersSent) {
          return res.status(429).json({
            error:
              "AI limit reached. Please wait.",
          });
        }

        res.write(
          "\n[System: AI limit reached. Please wait.]"
        );

        return res.end();
      }

      res.status(500).json({
        error:
          error.message ||
          "Internal server error",
      });
    }
  });

  // =========================
  // DEV MODE
  // =========================

  if (!isProd) {
    console.log(
      "Using Vite middleware"
    );

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
        "Vite Middleware Error:",
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

startServer().catch((err) => {
  console.error(
    "Server startup failed:",
    err
  );

  process.exit(1);
});
