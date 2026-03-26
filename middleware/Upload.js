// middleware/Upload.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 8080;

export const uploadToCloud = (fileNamePrefix = null) => {
  return async (req, res, next) => {
    try {
      // Ensure uploads folder exists
      const uploadDir = path.join(__dirname, "..", "uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      // Helper to save a file and return its URL
      const saveFile = (file) => {
        const originalName = file.originalname.replace(/\s/g, "-");
        const uniqueName = fileNamePrefix
          ? `${fileNamePrefix}-${Date.now()}-${originalName}`
          : `${Date.now()}-${originalName}`;
        const filePath = path.join(uploadDir, uniqueName);
        fs.writeFileSync(filePath, file.buffer);
        return `http://localhost:${PORT}/uploads/${uniqueName}`;
      };

      // SINGLE FILE
      if (req.file) {
        req.body.picture = saveFile(req.file);
      }

      // MULTIPLE FILES / fields
      if (req.files) {
        for (const fieldName in req.files) {
          const filesArray = req.files[fieldName];
          const urls = filesArray.map(saveFile);

          // if only one file, set single URL, else array
          req.body[fieldName] = urls.length === 1 ? urls[0] : urls;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};