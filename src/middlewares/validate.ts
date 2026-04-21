import type { NextFunction, Request, Response } from "express";
import { type ZodType, z } from "zod/v4";
import { ValidationError } from "../utils/errors.js";

export const validateBody = (schema: ZodType) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;

      throw new ValidationError(
        "Gönderilen Veriler Geçersiz",
        fieldErrors as Record<string, string[]>,
      );
    }

    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;

      throw new ValidationError(
        "Gönderilen sorgu parametreleri Geçersiz",
        fieldErrors as Record<string, string[]>,
      );
    }

    // Express 5'te req.query salt-okunur (getter), bu yüzden parsed değeri locals'ta taşıyoruz.
    res.locals.validatedQuery = result.data;
    next();
  };
};

export const validateParams = (schema: ZodType) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;

      throw new ValidationError(
        "Gönderilen URL parametreleri Geçersiz",
        fieldErrors as Record<string, string[]>,
      );
    }

    req.params = result.data as typeof req.params;
    next();
  };
};
