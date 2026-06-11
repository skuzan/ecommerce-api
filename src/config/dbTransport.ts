import { type LogEntry } from "winston";

import Transport from "winston-transport";
import { prisma } from "./database.js";

export class DbTransport extends Transport {
  log(info: LogEntry, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    const { level, message, ...meta } = info;

    prisma.log
      .create({
        data: {
          level,
          message: String(message),
          meta: JSON.parse(JSON.stringify(meta)),
        },
      })
      .catch((err) => console.error("Failed to log to database:", err));

    callback();
  }
}