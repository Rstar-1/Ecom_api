import fs from "fs";
import path from "path";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import multer from "multer";
import { uploadFileToGitHub, uploadBase64ToGitHub } from "../integrations/github";

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

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
];
export const FILE_TYPE_ERROR = "Only JPG, PNG, WEBP, GIF, SVG, and PDF allowed";

const multerInstance = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) return cb(new Error(FILE_TYPE_ERROR));
    cb(null, true);
  },
});

/** Automatically processes uploaded multipart files and pushes them to GitHub storage */
const processGitHubUploads = async (req: Request): Promise<void> => {
  const filesToUpload: Express.Multer.File[] = [];

  if (req.file) {
    filesToUpload.push(req.file);
  }

  if (req.files) {
    if (Array.isArray(req.files)) {
      filesToUpload.push(...req.files);
    } else {
      for (const field of Object.keys(req.files)) {
        const list = req.files[field];
        if (Array.isArray(list)) {
          filesToUpload.push(...list);
        }
      }
    }
  }

  if (filesToUpload.length === 0) return;

  await Promise.all(
    filesToUpload.map(async (file) => {
      const ghUrl = await uploadFileToGitHub(file);
      if (ghUrl) {
        (file as any).githubUrl = ghUrl;
      }
    })
  );
};

/** Global middleware that intercepts any base64 image data URLs in req.body and uploads them to GitHub */
export const resolveBase64Images = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.body && typeof req.body === "object") {
      const name =
        req.body.categoryName ||
        req.body.productName ||
        req.body.blogName ||
        req.body.name ||
        "img";

      if (typeof req.body.image === "string" && req.body.image.startsWith("data:image/")) {
        req.body.image = await uploadBase64ToGitHub(req.body.image, name);
      }

      if (Array.isArray(req.body.images)) {
        req.body.images = await Promise.all(
          req.body.images.map(async (img: unknown, idx: number) => {
            if (typeof img === "string" && img.startsWith("data:image/")) {
              return await uploadBase64ToGitHub(img, `${name}-${idx}`);
            }
            return img;
          })
        );
      }

      for (const field of ["shopPhoto", "gstCertificate", "panCard", "avatar", "bannerImageUrl"]) {
        if (typeof req.body[field] === "string" && req.body[field].startsWith("data:image/")) {
          req.body[field] = await uploadBase64ToGitHub(req.body[field], `${name}-${field}`);
        }
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const upload = {
  single: (field: string): RequestHandler => (req: Request, res: Response, next: NextFunction): void => {
    multerInstance.single(field)(req, res, async (err) => {
      if (err) return next(err);
      try {
        await processGitHubUploads(req);
        await resolveBase64Images(req, res, () => {});
        next();
      } catch (e) {
        next(e);
      }
    });
  },
  fields: (fields: multer.Field[]): RequestHandler => (req: Request, res: Response, next: NextFunction): void => {
    multerInstance.fields(fields)(req, res, async (err) => {
      if (err) return next(err);
      try {
        await processGitHubUploads(req);
        await resolveBase64Images(req, res, () => {});
        next();
      } catch (e) {
        next(e);
      }
    });
  },
  array: (field: string, maxCount?: number): RequestHandler => (req: Request, res: Response, next: NextFunction): void => {
    multerInstance.array(field, maxCount)(req, res, async (err) => {
      if (err) return next(err);
      try {
        await processGitHubUploads(req);
        await resolveBase64Images(req, res, () => {});
        next();
      } catch (e) {
        next(e);
      }
    });
  },
  none: (): RequestHandler => multerInstance.none(),
};

/** Public URL path or GitHub raw URL for an uploaded file. */
export const fileUrl = (file: Express.Multer.File | undefined): string | undefined => {
  if (!file) return undefined;
  if ((file as any).githubUrl) return (file as any).githubUrl;
  return file.filename ? `/uploads/${file.filename}` : file.path;
};

/** Parses multipart text fields (no files) only when the request is multipart; JSON passes through. */
export const handleFormData = (req: Request, res: Response, next: NextFunction): void => {
  if (req.is("multipart/form-data")) {
    multerInstance.none()(req, res, (err: unknown) => next(err));
    return;
  }
  next();
};


