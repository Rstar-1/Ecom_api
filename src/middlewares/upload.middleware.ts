import fs from "fs";
import path from "path";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";

export const UPLOAD_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

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

/** Public URL path for an uploaded file, e.g. "/uploads/1712-photo.png". */
export const fileUrl = (file: Express.Multer.File | undefined): string | undefined =>
  file ? (file.filename ? `/uploads/${file.filename}` : file.path) : undefined;

/** Parses multipart text fields (no files) only when the request is multipart; JSON passes through. */
export const handleFormData = (req: Request, res: Response, next: NextFunction): void => {
  if (req.is("multipart/form-data")) {
    upload.none()(req, res, (err: unknown) => next(err));
    return;
  }
  next();
};
