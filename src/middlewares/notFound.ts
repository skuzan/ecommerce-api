import type { Request, Response } from "express";

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `${req.method} ${req.originalUrl} endpointi bulunamadı`,
      code: "ROUTE_NOT_FOUND",
    },
  });
};
