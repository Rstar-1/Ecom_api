import fs from "fs";
import path from "path";

const LOGS_DIR = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const appLogPath = path.join(LOGS_DIR, "app.log");
const errorLogPath = path.join(LOGS_DIR, "error.log");
const accessLogPath = path.join(LOGS_DIR, "access.log");

const writeLog = (filePath: string, level: string, message: string) => {
  const line = `[${level}] ${new Date().toISOString()}: ${message}\n`;
  if (level === "ERROR") {
    console.error(line.trim());
  } else {
    console.log(line.trim());
  }
  fs.appendFile(filePath, line, (err) => {
    if (err) console.error("Error writing to log file", err);
  });
};

export const logger = {
  info: (msg: string) => writeLog(appLogPath, "INFO", msg),
  warn: (msg: string) => writeLog(appLogPath, "WARN", msg),
  error: (msg: string) => {
    writeLog(appLogPath, "ERROR", msg);
    writeLog(errorLogPath, "ERROR", msg);
  },
};

export const info = logger.info;
export const warn = logger.warn;
export const error = logger.error;

/** Stream for Morgan HTTP access logging */
export const accessLogStream = fs.createWriteStream(accessLogPath, { flags: "a" });
