import fs from "fs";
import path from "path";
import sharp from "sharp";
import {
  convertHeicToJpeg,
  getJpegOutputPaths,
  isHeicFile,
  JPEG_QUALITY,
} from "./convertHeicToJpeg";

export { isHeicFile } from "./convertHeicToJpeg";

const JPEG_EXTENSIONS = new Set([".jpg", ".jpeg", ".jpe"]);

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".jpe",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".tiff",
  ".tif",
  ".gif",
  ".bmp",
  ".avif",
]);

export const isJpegFile = (fileName: string) =>
  JPEG_EXTENSIONS.has(path.extname(fileName).toLowerCase());

const NON_RASTER_MIME_TYPES = new Set(["image/svg+xml"]);

export const isImageFile = (fileName: string, mimeType?: string) => {
  if (mimeType) {
    if (NON_RASTER_MIME_TYPES.has(mimeType)) {
      return false;
    }

    if (mimeType.startsWith("image/")) {
      return true;
    }
  }

  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".svg") {
    return false;
  }

  return IMAGE_EXTENSIONS.has(ext);
};

export type EnsureJpegResult = {
  filePath: string;
  fileName: string;
  wasConverted: boolean;
};

const convertWithSharp = async (inputPath: string, outputPath: string) => {
  await sharp(inputPath)
    .rotate()
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(outputPath);
};

const isHeicConversionError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  return (
    normalized.includes("heif") ||
    normalized.includes("heic") ||
    normalized.includes("avif")
  );
};

export const ensureJpeg = async (
  inputPath: string,
  originalFileName: string,
  mimeType?: string,
): Promise<EnsureJpegResult> => {
  if (isJpegFile(originalFileName)) {
    return {
      filePath: inputPath,
      fileName: originalFileName,
      wasConverted: false,
    };
  }

  const { outputFileName, outputPath } = getJpegOutputPaths(
    inputPath,
    originalFileName,
  );

  try {
    await convertWithSharp(inputPath, outputPath);
  } catch (error) {
    if (isHeicFile(originalFileName, mimeType) || isHeicConversionError(error)) {
      await convertHeicToJpeg(inputPath, outputPath);
    } else {
      throw error;
    }
  }

  await fs.promises.unlink(inputPath).catch(() => {});

  return {
    filePath: outputPath,
    fileName: outputFileName,
    wasConverted: true,
  };
};
