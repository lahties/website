import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function integerSetting(name, fallback, minimum, maximum) {
  const raw = process.env[name];
  const value = raw === undefined ? fallback : Number.parseInt(raw, 10);

  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} to ${maximum}.`);
  }

  return value;
}

const maxWidth = integerSetting("MAX_WIDTH", 2400, 1, 20000);
const maxHeight = integerSetting("MAX_HEIGHT", 2400, 1, 20000);
const jpegQuality = integerSetting("JPEG_QUALITY", 82, 1, 100);
const webpQuality = integerSetting("WEBP_QUALITY", 82, 1, 100);
const minimumSavings = integerSetting("MIN_SAVINGS_PERCENT", 2, 0, 100);

const listPath = process.argv[2];
if (!listPath) {
  throw new Error("Usage: node optimize-images.mjs <null-delimited-file-list>");
}

const root = process.cwd();
const rawList = await fs.readFile(listPath);
const files = rawList
  .toString("utf8")
  .split("\0")
  .filter(Boolean);

let optimizedCount = 0;
let skippedCount = 0;
let originalTotal = 0;
let optimizedTotal = 0;

for (const relativeFile of files) {
  const normalized = path.normalize(relativeFile);

  if (path.isAbsolute(normalized) || normalized.startsWith(`..${path.sep}`)) {
    throw new Error(`Refusing to process a path outside the repository: ${relativeFile}`);
  }

  const extension = path.extname(normalized).toLowerCase();
  if (!supportedExtensions.has(extension)) {
    continue;
  }

  const filePath = path.join(root, normalized);

  let stats;
  try {
    stats = await fs.stat(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      continue;
    }
    throw error;
  }

  if (!stats.isFile()) {
    continue;
  }

  try {
    const original = await fs.readFile(filePath);
    const metadata = await sharp(original, { failOn: "warning" }).metadata();

    // Do not accidentally flatten animated WebP or other multi-page images.
    if ((metadata.pages ?? 1) > 1) {
      console.log(`skip animated/multi-page: ${relativeFile}`);
      skippedCount += 1;
      continue;
    }

    const needsResize =
      (metadata.width ?? 0) > maxWidth || (metadata.height ?? 0) > maxHeight;

    let pipeline = sharp(original, { failOn: "warning" })
      .autoOrient()
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      });

    if (extension === ".jpg" || extension === ".jpeg") {
      pipeline = pipeline.jpeg({
        quality: jpegQuality,
        mozjpeg: true,
        progressive: true,
      });
    } else if (extension === ".png") {
      pipeline = pipeline.png({
        compressionLevel: 9,
        adaptiveFiltering: true,
      });
    } else if (extension === ".webp") {
      pipeline = pipeline.webp({
        quality: webpQuality,
        effort: 5,
        smartSubsample: true,
      });
    }

    const output = await pipeline.toBuffer();
    const savingsPercent = ((original.length - output.length) / original.length) * 100;

    // Never replace an image with a larger file. For images that did not need
    // resizing, avoid needless rewrites and repeated lossy re-encoding.
    if (
      output.length >= original.length ||
      (!needsResize && savingsPercent < minimumSavings)
    ) {
      console.log(`keep original: ${relativeFile}`);
      skippedCount += 1;
      continue;
    }

    const temporaryPath = `${filePath}.optimize-${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, output, { mode: stats.mode });
    await fs.rename(temporaryPath, filePath);

    originalTotal += original.length;
    optimizedTotal += output.length;
    optimizedCount += 1;

    console.log(
      `optimized: ${relativeFile} ` +
        `${formatBytes(original.length)} -> ${formatBytes(output.length)} ` +
        `(${savingsPercent.toFixed(1)}% smaller)`,
    );
  } catch (error) {
    throw new Error(`Could not optimize ${relativeFile}: ${error.message}`, {
      cause: error,
    });
  }
}

if (optimizedCount === 0) {
  console.log(`No images optimized; ${skippedCount} skipped or already efficient.`);
} else {
  const totalSavings = ((originalTotal - optimizedTotal) / originalTotal) * 100;
  console.log(
    `Optimized ${optimizedCount} image(s): ` +
      `${formatBytes(originalTotal)} -> ${formatBytes(optimizedTotal)} ` +
      `(${totalSavings.toFixed(1)}% smaller).`,
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[index]}`;
}
