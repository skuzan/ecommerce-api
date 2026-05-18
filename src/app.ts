import express from "express";
import { env } from "./config/env.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import helmet from "helmet";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import z from "zod/v4";
import { validateBody } from "./middlewares/validate.js";
import cookieParser from "cookie-parser";
import { apiLimiter } from "./middlewares/rateLimiters.js";
import path from "node:path";

const app = express();

app.disable("x-powered-by")


app.use(helmet({
  ...(env.NODE_ENV !== "production" && { contentSecurityPolicy: false }),
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); //! 1. Sıra Güvenlik

app.use(cors()); //! 2. Sıra Cors

app.use(express.json()); //! 3. Sıra Body Parsing

app.use(cookieParser()) //! 4. Cookie Parser

app.use("/uploads", express.static(path.resolve("uploads"), {
  index: false,
  maxAge: "1d"
})) //! 5. Static files

app.use(apiLimiter) //! 6. Sıra API Limiting

app.use(requestLogger); //! 7. Request Logging

app.get("/health", (req, res) => {
  res.json({
    success: true,
    data: { status: "OK", uptime: Math.floor(process.uptime()) },
  });
});

app.use("/api/v1", routes);
// app.use("/api/v2", routes);

const testSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().positive(),
});

app.post("/test-validation", validateBody(testSchema), (req, res) => {
  res.json({
    success: true,
    data: req.body,
  });
});

app.use(notFound);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`🚀 Sunucu: http://localhost:${env.PORT}`);
  console.log(`🌍 Ortam: ${env.NODE_ENV}`);
  console.log(`📘 API: http://localhost:${env.PORT}/api/v1`);
});
