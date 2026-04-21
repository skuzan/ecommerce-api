import type { NextFunction } from "express";

import { type Request, type Response } from "express";

const requestCounts: Map<
  string,
  {
    count: number;
    resetTime: number;
  }
> = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000; // 1 dakika
const MAX_REQUESTS = 20;

export const rateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ip: any = req.ip;
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    next();
    return;
  }

  record.count++;

  if (record.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.set("Retry-After", String(retryAfter));
    res.status(429).json({
      success: false,
      error: {
        message: `Çok fazla istek yapıldı, ${retryAfter} sn sonra tekrar deneyin`,
        code: "RATE_LIMIT_EXCEEDED",
      },
    });
    return;
  }
  next();
};
