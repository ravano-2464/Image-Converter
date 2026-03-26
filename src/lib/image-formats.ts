export const INPUT_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".bmp",
  ".tiff",
  ".tif",
  ".avif",
  ".svg",
  ".heic",
  ".heif",
] as const;

export const OUTPUT_FORMATS = [
  {
    value: "jpg",
    label: "JPG",
    description: "Ringan dan cocok untuk foto sehari-hari.",
  },
  {
    value: "png",
    label: "PNG",
    description: "Lossless dan tetap aman untuk transparansi.",
  },
  {
    value: "webp",
    label: "WEBP",
    description: "Modern, hemat ukuran, dan pas untuk web.",
  },
  {
    value: "avif",
    label: "AVIF",
    description: "Kompresi paling efisien untuk generasi baru.",
  },
  {
    value: "tiff",
    label: "TIFF",
    description: "Pilihan arsip saat butuh detail yang lebih kaya.",
  },
] as const;

export type OutputFormat = (typeof OUTPUT_FORMATS)[number]["value"];

export const OUTPUT_EXTENSION_MAP: Record<OutputFormat, string> = {
  jpg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
  tiff: "tiff",
};

export const OUTPUT_MIME_MAP: Record<OutputFormat, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  tiff: "image/tiff",
};

export const IMAGE_ACCEPT = INPUT_EXTENSIONS.join(",");

export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const lossyFormats = new Set<OutputFormat>(["jpg", "webp", "avif"]);

export function isLossyFormat(format: OutputFormat) {
  return lossyFormats.has(format);
}

export function normalizeOutputFormat(
  format: string | null | undefined,
): OutputFormat | null {
  if (!format) {
    return null;
  }

  const matchedFormat = OUTPUT_FORMATS.find((item) => item.value === format);
  return matchedFormat?.value ?? null;
}
