import JSZip from "jszip";
import { NextResponse } from "next/server";
import sharp from "sharp";
import {
  MAX_FILE_SIZE_BYTES,
  OUTPUT_EXTENSION_MAP,
  OUTPUT_MIME_MAP,
  type OutputFormat,
  normalizeOutputFormat,
} from "@/lib/image-formats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeFileName(fileName: string) {
  const baseName = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

  return baseName || "image";
}

function clampQuality(quality: number) {
  return Math.min(100, Math.max(55, Math.round(quality)));
}

function buildPipeline(
  image: sharp.Sharp,
  format: OutputFormat,
  quality: number,
) {
  switch (format) {
    case "jpg":
      return image.flatten({ background: "#ffffff" }).jpeg({
        mozjpeg: true,
        quality,
      });
    case "png":
      return image.png({
        compressionLevel: 9,
      });
    case "webp":
      return image.webp({
        effort: 5,
        quality,
      });
    case "avif":
      return image.avif({
        effort: 6,
        quality,
      });
    case "tiff":
      return image.tiff({
        compression: "lzw",
        quality,
      });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const format = normalizeOutputFormat(formData.get("format")?.toString());
    const rawQuality = Number(formData.get("quality") ?? 88);
    const quality = clampQuality(Number.isFinite(rawQuality) ? rawQuality : 88);
    const uploadedFiles = formData
      .getAll("files")
      .filter(
        (entry): entry is File => entry instanceof File && entry.size > 0,
      );

    if (!format) {
      return NextResponse.json(
        { error: "Format output belum valid." },
        { status: 400 },
      );
    }

    if (!uploadedFiles.length) {
      return NextResponse.json(
        { error: "Belum ada file yang dikirim untuk diproses." },
        { status: 400 },
      );
    }

    const oversizedFile = uploadedFiles.find(
      (file) => file.size > MAX_FILE_SIZE_BYTES,
    );
    if (oversizedFile) {
      return NextResponse.json(
        { error: `${oversizedFile.name} melebihi batas ukuran upload.` },
        { status: 400 },
      );
    }

    const convertedFiles: Array<{ buffer: Buffer; fileName: string }> = [];

    for (const file of uploadedFiles) {
      const sourceBuffer = Buffer.from(await file.arrayBuffer());
      const resultBuffer = await buildPipeline(
        sharp(sourceBuffer, { failOn: "none" }).rotate(),
        format,
        quality,
      ).toBuffer();

      convertedFiles.push({
        buffer: resultBuffer,
        fileName: `${sanitizeFileName(file.name)}.${OUTPUT_EXTENSION_MAP[format]}`,
      });
    }

    if (convertedFiles.length === 1) {
      const [convertedFile] = convertedFiles;

      return new NextResponse(Uint8Array.from(convertedFile.buffer), {
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition": `attachment; filename="${convertedFile.fileName}"`,
          "Content-Type": OUTPUT_MIME_MAP[format],
        },
      });
    }

    const zip = new JSZip();

    for (const convertedFile of convertedFiles) {
      zip.file(convertedFile.fileName, convertedFile.buffer);
    }

    const zipBuffer = await zip.generateAsync({
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
      type: "nodebuffer",
    });

    return new NextResponse(Uint8Array.from(zipBuffer), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="converted-${format}.zip"`,
        "Content-Type": "application/zip",
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Konversi gagal diproses. Pastikan file gambar kamu valid dan formatnya didukung.",
      },
      { status: 500 },
    );
  }
}
