import fs from "fs";

const write = (level: string, message: string) => {
  const line = `[${level}] ${new Date().toISOString()}: ${message}`;
  console.log(line);
  fs.appendFile("application.log", line + "\n", (err) => {
    if (err) console.error("Error writing to log file", err);
  });
};

export const info = (message: string) => write("INFO", message);
export const warn = (message: string) => write("WARN", message);
export const error = (message: string) => write("ERROR", message);
