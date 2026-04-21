import type { NextFunction } from "express";

import { type Request, type Response } from "express";

const VALID_API_KEY: string = process.env.API_KEY || "test-api-key-123";

export const apiKeyCheck = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: "API anahtarı gerekli",
      code: "MISSING_API_KEY",
    });
    return;
  }

  if (apiKey !== VALID_API_KEY) {
    res.status(401).json({
      success: false,
      error: "Geçersiz API anahtarı",
      code: "INVALID_API_KEY",
    });
    return;
  }
  next();
};
