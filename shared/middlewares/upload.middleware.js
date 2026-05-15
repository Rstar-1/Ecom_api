import multer from "multer";
import fs from "fs";
import path from "path";

/* ================= UPLOAD PATH ================= */
const uploadPath = path.join(process.cwd(), "uploads");

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