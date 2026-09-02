import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export const JPEG_QUALITY = 90;

const MAGICK_CANDIDATES = [
  "magick",
  "convert",
  "/usr/bin/magick",
  "/usr/bin/convert",
  "/opt/homebrew/bin/magick",
  "/usr/local/bin/magick",
  "/opt/homebrew/bin/convert",
  "/usr/local/bin/convert",
];

const HEIC_EXTENSIONS = new Set([".heic", ".heif"]);

export const isHeicFile = (fileName: string, mimeType?: string) => {
  const ext = path.extname(fileName).toLowerCase();

  if (HEIC_EXTENSIONS.has(ext)) {
    return true;
  }

  return mimeType === "image/heic" || mimeType === "image/heif";
};

let cachedMagickCommand: string | null | undefined;

const hasHeicSupport = (formatsList: string) => {
  const formats = formatsList.toLowerCase();

  return formats.includes("heic") || formats.includes("heif");
};

export const getImageMagickCommand = async (): Promise<string | null> => {
  if (cachedMagickCommand !== undefined) {
    return cachedMagickCommand;
  }

  for (const command of MAGICK_CANDIDATES) {
    try {
      await execFileAsync(command, ["-version"], { timeout: 5000 });

      const { stdout } = await execFileAsync(command, ["-list", "format"], {
        timeout: 10000,
      });

      if (hasHeicSupport(stdout)) {
        cachedMagickCommand = command;
        return command;
      }
    } catch {
      continue;
    }
  }

  cachedMagickCommand = null;
  return null;
};

const convertHeicWithImageMagick = async (
  command: string,
  inputPath: string,
  outputPath: string,
) => {
  const inputArg = `${inputPath}[0]`;

  await execFileAsync(
    command,
    [inputArg, "-quality", String(JPEG_QUALITY), outputPath],
    { timeout: 120000, maxBuffer: 10 * 1024 * 1024 },
  );
};

const IMAGE_MAGICK_INSTALL_HINT =
  "Install ImageMagick with HEIC support: " +
  "brew install libheif imagemagick (macOS) or apt install imagemagick libheif1 (Linux).";

export const convertHeicToJpeg = async (
  inputPath: string,
  outputPath: string,
) => {
  const magickCommand = await getImageMagickCommand();

  if (!magickCommand) {
    throw new Error(
      `ImageMagick with HEIC support not found. ${IMAGE_MAGICK_INSTALL_HINT}`,
    );
  }

  await convertHeicWithImageMagick(magickCommand, inputPath, outputPath);
};

export const getJpegOutputPaths = (
  inputPath: string,
  originalFileName: string,
) => {
  const parsed = path.parse(originalFileName);

  return {
    outputFileName: `${parsed.name}.jpeg`,
    outputPath: path.join(
      path.dirname(inputPath),
      `${parsed.name}_${Date.now()}.jpeg`,
    ),
  };
};
