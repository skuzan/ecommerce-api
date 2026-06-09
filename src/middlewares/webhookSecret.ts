import { type RequestHandler } from "express";
import { UnauthorizedError } from "../utils/errors.js";

export function verifyWebhookSecret(expectedSecret: string): RequestHandler {
  return (req, _res, next) => {
    const provided = req.get("X-Webhook-Secret");

    if (!provided || provided !== expectedSecret) {
      throw new UnauthorizedError("Geçersiz webhook gizli anahtarı");
    }
    next();
  };
}
