import fs from "fs";

export const ensureDir = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Directory created: ${dirPath}`);
    }
  } catch (err) {
    console.error("❌ Failed to create directory:", err.message);
  }
};

// 👉 BONUS: create multiple dirs at once
export const ensureDirs = (dirs = []) => {
  dirs.forEach((dir) => ensureDir(dir));
};