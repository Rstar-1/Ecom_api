import fs from "fs";
import path from "path";
import { ENV } from "../../config/env";
import { logger } from "../../utils";

export interface GitHubUploadResult {
  url: string;
  rawUrl: string;
  filename: string;
  path: string;
  sha?: string;
}

/**
 * Directly uploads a file buffer to the configured GitHub repository via GitHub REST API.
 * Target repository: https://github.com/:owner/:repo/tree/:branch/:folder
 * Output raw URL: https://raw.githubusercontent.com/:owner/:repo/refs/heads/:branch/:folder/:filename
 */
export const uploadFileToGitHub = async (
  file: Express.Multer.File
): Promise<string | null> => {
  const token = ENV.GITHUB_TOKEN?.trim();
  const owner = ENV.GITHUB_OWNER?.trim() || "Rstar-1";
  const repo = ENV.GITHUB_REPO?.trim() || "generic_images";
  const branch = ENV.GITHUB_BRANCH?.trim() || "main";
  const folder = (ENV.GITHUB_FOLDER?.trim() || "ashmita").replace(/^\/+|\/+$/g, "");

  if (!token) {
    logger.warn("⚠️ GITHUB_TOKEN is not configured in env/dev.env. Image saved locally.");
    return null;
  }

  try {
    let buffer: Buffer;
    if (file.buffer) {
      buffer = file.buffer;
    } else if (file.path && fs.existsSync(file.path)) {
      buffer = fs.readFileSync(file.path);
    } else {
      logger.error(`GitHub upload failed: No buffer or file path found for ${file.originalname}`);
      return null;
    }

    const cleanFilename = file.filename || `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    const targetPath = folder ? `${folder}/${cleanFilename}` : cleanFilename;
    const base64Content = buffer.toString("base64");
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${targetPath}`;

    // Check if the file already exists on GitHub to obtain its sha for update
    let sha: string | undefined;
    try {
      const checkRes = await fetch(`${apiUrl}?ref=${branch}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Ecom-Api-Image-Uploader",
        },
      });
      if (checkRes.ok) {
        const existingData = (await checkRes.json()) as { sha?: string };
        sha = existingData?.sha;
      }
    } catch {
      // Ignore not found
    }

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Ecom-Api-Image-Uploader",
      },
      body: JSON.stringify({
        message: `Upload ${cleanFilename} via Ecom API`,
        content: base64Content,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const errorText = await putRes.text();
      logger.error(`GitHub API upload failed (${putRes.status}): ${errorText}`);
      return null;
    }

    // Direct GitHub raw user content URL
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${branch}/${targetPath}`;
    logger.info(`✅ Image uploaded to GitHub successfully: ${rawUrl}`);

    return rawUrl;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`GitHub upload exception: ${message}`);
    return null;
  }
};

/**
 * Automatically detects and uploads base64 data URLs to GitHub, returning the raw GitHub URL.
 * If not base64 or already a URL, returns the original string.
 */
export const uploadBase64ToGitHub = async (
  base64OrUrl: string | undefined,
  prefix = "img"
): Promise<string> => {
  if (!base64OrUrl || typeof base64OrUrl !== "string") return "";

  const trimmed = base64OrUrl.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/uploads/")
  ) {
    return trimmed;
  }

  // Check if it's a base64 data URL
  const match = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/s);
  if (!match) {
    return trimmed;
  }

  const rawExt = (match[1] ?? "jpg").toLowerCase();
  const ext = rawExt === "jpeg" ? "jpg" : rawExt === "svg+xml" ? "svg" : rawExt;
  const base64Data: string = match[2] ?? "";

  const token = ENV.GITHUB_TOKEN?.trim();
  const owner = ENV.GITHUB_OWNER?.trim() || "Rstar-1";
  const repo = ENV.GITHUB_REPO?.trim() || "generic_images";
  const branch = ENV.GITHUB_BRANCH?.trim() || "main";
  const folder = (ENV.GITHUB_FOLDER?.trim() || "ashmita").replace(/^\/+|\/+$/g, "");

  const cleanPrefix = prefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30) || "img";
  const filename = `${Date.now()}-${cleanPrefix}.${ext}`;

  if (!token) {
    try {
      const UPLOAD_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
      if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(base64Data, "base64"));
      logger.warn(`⚠️ GITHUB_TOKEN not set. Saved base64 image locally: /uploads/${filename}`);
      return `/uploads/${filename}`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to save local fallback: ${msg}`);
      return trimmed;
    }
  }

  try {
    const targetPath = folder ? `${folder}/${filename}` : filename;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${targetPath}`;

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Ecom-Api-Image-Uploader",
      },
      body: JSON.stringify({
        message: `Upload ${filename} via Ecom API`,
        content: base64Data,
        branch,
      }),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      logger.error(`GitHub API upload failed (${putRes.status}): ${errText}`);
      const UPLOAD_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
      if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(base64Data, "base64"));
      return `/uploads/${filename}`;
    }

    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${branch}/${targetPath}`;
    logger.info(`✅ Base64 image uploaded to GitHub successfully: ${rawUrl}`);
    return rawUrl;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`GitHub upload exception: ${message}`);
    return trimmed;
  }
};

