import type { Request } from "express";
import morgan from "morgan";
import { logger } from "../config/logger.js";

// export const requestLogger = (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   const start = Date.now();

//   console.log(`${req.method} ${req.originalUrl}`);

//   if (req.body && Object.keys(req.body).length > 0) {
//     console.log(`Body ${JSON.stringify(req.body)}`);
//   }

//   res.on("finish", () => {
//     const duration = Date.now() - start;
//     const emoji = res.statusCode < 400 ? "✅" : "⚠️";
//     console.log(
//       `${emoji} ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`,
//     );
//   });
//   next();
// };

morgan.token("request-id", (req) => (req as Request).requestId ?? "-");

export const requestLogger = morgan(
  "[:request-id] :method :url :status - :response-time ms",
  {
    stream: {
      write: (message) => {
        logger.http(message.trim());
      },
    },
  },
);
