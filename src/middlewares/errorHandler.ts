import type { NextFunction, Request, Response } from "express";
import { AppError, ValidationError } from "../utils/errors.js";
import { Prisma } from "../generated/prisma/client.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    stack: err.stack,
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip,
  };

  if (err instanceof AppError && err.isOperational) {
    console.warn(JSON.stringify(errorLog, null, 2));
  } else {
    console.error(JSON.stringify(errorLog, null, 2));
  }

  if (err instanceof AppError) {
    const responseBody: Record<string, any> = {
      success: false,
      error: {
        message: err.message,
        code: err.code,
      },
    };
    if (err instanceof ValidationError) {
      responseBody.error.details = err.details;
    }
    res.status(err.statusCode).json(responseBody);
    return;
  }

  if (err.message.includes("Unexpected token")) {
    res.status(400).json({
      success: false,
      error: {
        message: "Geçersiz JSON formatı",
        code: "INVALID_JSON",
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        error: {
          message: "Bu kayıt Zaten mevcut",
          code: "CONFLICT",
        },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        error: {
          message: "Kayıt bulunamadı",
          code: "NOT_FOUND",
        },
      });
      return;
    }
  }

  const isProduction = process.env.NODE_ENV === "production";

  res.status(500).json({
    success: false,
    error: {
      message: isProduction ? "Sunucu hatası" : `Sunucu hatası, ${err.message}`,
      code: "INTERNAL_ERROR",
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
};
