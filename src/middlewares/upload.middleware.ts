import fs from "fs";
import path from "path";
import multer from "multer";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${Date.now()}-${name.replace(/\s+/g, "_")}${ext}`);
  },
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
export const FILE_TYPE_ERROR = "Only JPG, PNG, PDF allowed";

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) return cb(new Error(FILE_TYPE_ERROR));
    cb(null, true);
  },
});
