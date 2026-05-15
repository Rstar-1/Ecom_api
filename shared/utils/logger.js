import fs from "fs";

const logToConsole = (message) => {
  console.log(message);
};

const logToFile = (message, filePath = "application.log") => {
  fs.appendFile(filePath, message + "\n", (err) => {
    if (err) {
      console.error("Error writing to log file", err);
    }
  });
};

export const info = (message) => {
  const logMessage = `[INFO] ${new Date().toISOString()}: ${message}`;
  logToConsole(logMessage);
  logToFile(logMessage);
};

export const error = (message) => {
  const logMessage = `[ERROR] ${new Date().toISOString()}: ${message}`;
  logToConsole(logMessage);
  logToFile(logMessage);
};

export const warn = (message) => {
  const logMessage = `[WARN] ${new Date().toISOString()}: ${message}`;
  logToConsole(logMessage);
  logToFile(logMessage);
};