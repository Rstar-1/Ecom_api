import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= COMMON UPLOADS PATH (OUTSIDE OF SERVICES) ================= */
// Resolves to d:\Ecom_api\uploads regardless of current working directory
export const uploadPath =
  process.env.UPLOADS_DIR || path.resolve(__dirname, "../../uploads");

/* ================= CREATE FOLDER ================= */
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

/* ================= STORAGE ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);

    const uniqueName =
      Date.now() + "-" + name.replace(/\s+/g, "_") + ext;

    cb(null, uniqueName);
  },
});

/* ================= FILE FILTER ================= */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, PDF allowed"), false);
  }

  cb(null, true);
};

/* ================= MULTER INSTANCE ================= */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export default { upload, uploadPath };
