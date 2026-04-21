import type { NextFunction, Response, Request } from "express";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  console.log(`${req.method} ${req.originalUrl}`);

  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`Body ${JSON.stringify(req.body)}`);
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    const emoji = res.statusCode < 400 ? "✅" : "⚠️";
    console.log(
      `${emoji} ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`,
    );
  });
  next();
};
