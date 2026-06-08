import { type RequestHandler } from "express";
import { ValidationError } from "../utils/errors.js";


export const requireIdempotencyKey: RequestHandler = (req, _res, next) => {
  const key = req.get("Idempotency-Key");
  if (!key || key.length < 8) {
    throw new ValidationError("Idempotency-Key header zorunlu", {
      "Idempotency-Key": [
        "İstek başına benzersiz bir anahtar gönderin (örn. UUID)",
      ],
    });
  }
  req.idempotencyKey = key;
  next();
};
