"use client";

import type { ChangeEvent, DragEvent } from "react";
import { startTransition, useEffect, useId, useRef, useState } from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
  FileArchive,
  FileImage,
  ImagePlus,
  LoaderCircle,
  ScanSearch,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  IMAGE_ACCEPT,
  INPUT_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  OUTPUT_EXTENSION_MAP,
  OUTPUT_FORMATS,
  type OutputFormat,
  isLossyFormat,
} from "@/lib/image-formats";
import { cn } from "@/lib/utils";

type SelectedFile = {
  id: string;
  file: File;
  previewUrl: string;
  extension: string;
  sizeLabel: string;
};

function formatBytes(bytes: number) {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;
  const precision = value >= 10 || unitIndex === 0 ? 0 : 1;

  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

function getExtension(name: string) {
  const lastDotIndex = name.lastIndexOf(".");

  if (lastDotIndex < 0) {
    return "RAW";
  }

  return name.slice(lastDotIndex + 1).toUpperCase();
}

function getBaseName(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

function createSelectedFile(file: File): SelectedFile {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    extension: getExtension(file.name),
    sizeLabel: formatBytes(file.size),
  };
}

function revokeFilePreviews(files: SelectedFile[]) {
  for (const file of files) {
    URL.revokeObjectURL(file.previewUrl);
  }
}

function getFilenameFromDisposition(
  disposition: string | null,
  fallback: string,
) {
  if (!disposition) {
    return fallback;
  }

  const utfFilenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfFilenameMatch?.[1]) {
    try {
      return decodeURIComponent(utfFilenameMatch[1]);
    } catch {
      return utfFilenameMatch[1];
    }
  }

  const asciiFilenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  return asciiFilenameMatch?.[1] ?? fallback;
}

function downloadBlob(blob: Blob, filename: string) {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
}

export function ImageConverter() {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestFilesRef = useRef<SelectedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("webp");
  const [quality, setQuality] = useState([88]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    latestFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  useEffect(() => {
    return () => {
      revokeFilePreviews(latestFilesRef.current);
    };
  }, []);

  const activeFormat =
    OUTPUT_FORMATS.find((format) => format.value === outputFormat) ??
    OUTPUT_FORMATS[0];
  const qualityValue = quality[0] ?? 88;
  const isQualityEnabled = isLossyFormat(outputFormat);
  const batchWillZip = selectedFiles.length > 1;

  function appendFiles(files: File[]) {
    const imageFiles = files.filter((file) => {
      const loweredName = file.name.toLowerCase();
      return (
        file.type.startsWith("image/") ||
        INPUT_EXTENSIONS.some((extension) => loweredName.endsWith(extension))
      );
    });

    if (!imageFiles.length) {
      toast.error("Pilih file gambar yang valid dulu ya.");
      return;
    }

    const oversizedFiles = imageFiles.filter(
      (file) => file.size > MAX_FILE_SIZE_BYTES,
    );
    const safeFiles = imageFiles.filter(
      (file) => file.size <= MAX_FILE_SIZE_BYTES,
    );

    if (oversizedFiles.length > 0) {
      toast.warning(
        `${oversizedFiles.length} file dilewati karena melebihi ${MAX_FILE_SIZE_MB} MB.`,
      );
    }

    if (!safeFiles.length) {
      return;
    }

    startTransition(() => {
      setSelectedFiles((currentFiles) => [
        ...currentFiles,
        ...safeFiles.map(createSelectedFile),
      ]);
    });

    toast.success(`${safeFiles.length} file siap dikonversi.`);
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    appendFiles(files);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    appendFiles(Array.from(event.dataTransfer.files));
  }

  function removeFile(fileId: string) {
    const removedFile = selectedFiles.find((file) => file.id === fileId);
    if (removedFile) {
      revokeFilePreviews([removedFile]);
    }

    setSelectedFiles((currentFiles) =>
      currentFiles.filter((file) => file.id !== fileId),
    );
  }

  function clearFiles() {
    revokeFilePreviews(selectedFiles);
    setSelectedFiles([]);
  }

  async function handleConvert() {
    if (!selectedFiles.length) {
      toast.error("Tambahkan minimal satu gambar dulu.");
      return;
    }

    const formData = new FormData();
    for (const entry of selectedFiles) {
      formData.append("files", entry.file);
    }

    formData.append("format", outputFormat);
    formData.append("quality", String(qualityValue));

    setIsConverting(true);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(
          errorPayload?.error ?? "Proses convert gagal. Coba lagi sebentar.",
        );
      }

      const convertedBlob = await response.blob();
      const fallbackFilename = batchWillZip
        ? `converted-${outputFormat}.zip`
        : `${getBaseName(selectedFiles[0]?.file.name ?? "image")}.${
            OUTPUT_EXTENSION_MAP[outputFormat]
          }`;

      downloadBlob(
        convertedBlob,
        getFilenameFromDisposition(
          response.headers.get("content-disposition"),
          fallbackFilename,
        ),
      );

      toast.success(
        batchWillZip
          ? `${selectedFiles.length} file berhasil dikonversi dan dibungkus ke ZIP.`
          : `${selectedFiles[0]?.file.name} berhasil dikonversi.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi error yang tidak dikenal.",
      );
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 lg:gap-8">
      <section className="border-border/70 relative overflow-hidden rounded-[2rem] border bg-white/80 p-6 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.45)] backdrop-blur xl:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/70 via-white/55 to-white/20" />
        <div className="pointer-events-none absolute -top-16 right-0 size-72 rounded-full bg-[#0f766e]/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 size-72 rounded-full bg-[#fb923c]/12 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[#0f766e] text-white hover:bg-[#0f766e]">
                shadcn-ui
              </Badge>
              <Badge variant="outline">sharp server converter</Badge>
              <Badge variant="outline">React Toastify</Badge>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium tracking-[0.28em] text-[#0f766e] uppercase">
                Batch Image Converter
              </p>
              <h1 className="text-foreground max-w-3xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
                Konversi gambar lintas format dengan UI yang bersih dan proses
                yang cepat.
              </h1>
              <p className="text-muted-foreground max-w-2xl text-base leading-7 sm:text-lg">
                Upload banyak file sekaligus, pilih output yang kamu mau, atur
                kualitas, lalu download hasilnya otomatis sebagai file tunggal
                atau ZIP.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                size="lg"
                type="button"
              >
                <Upload />
                Pilih Gambar
              </Button>
              <Button
                disabled={!selectedFiles.length}
                onClick={handleConvert}
                size="lg"
                type="button"
                variant="outline"
              >
                {isConverting ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <ArrowRightLeft />
                )}
                {isConverting ? "Mengonversi..." : "Convert Sekarang"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[1.4rem] border border-white/60 bg-white/70 p-4 backdrop-blur">
              <p className="text-muted-foreground text-sm">Format input</p>
              <p className="mt-2 text-3xl font-semibold">
                {INPUT_EXTENSIONS.length}+
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                PNG, JPG, WEBP, HEIC, SVG, dan lainnya.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/60 bg-white/70 p-4 backdrop-blur">
              <p className="text-muted-foreground text-sm">Format output</p>
              <p className="mt-2 text-3xl font-semibold">
                {OUTPUT_FORMATS.length}
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                JPG, PNG, WEBP, AVIF, dan TIFF.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/60 bg-white/70 p-4 backdrop-blur">
              <p className="text-muted-foreground text-sm">
                Batch sekali jalan
              </p>
              <p className="mt-2 text-3xl font-semibold">Unlimited</p>
              <p className="text-muted-foreground mt-2 text-sm">
                Upload sebanyak yang kamu perlu, lalu bundle ke ZIP otomatis.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_380px]">
        <Card className="border-white/70 bg-white/85 shadow-[0_26px_70px_-44px_rgba(15,23,42,0.48)] backdrop-blur">
          <CardHeader className="gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">
                  Upload dan antrean file
                </CardTitle>
                <CardDescription>
                  Drag-and-drop file gambar atau pilih langsung dari
                  perangkatmu.
                </CardDescription>
              </div>
              <Badge variant="outline">{selectedFiles.length} file</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <input
              accept={IMAGE_ACCEPT}
              className="sr-only"
              id={inputId}
              multiple
              onChange={handleFileSelection}
              ref={fileInputRef}
              type="file"
            />

            <div
              className={cn(
                "rounded-[1.8rem] border border-dashed px-6 py-10 transition-all",
                isDragging
                  ? "border-[#0f766e] bg-[#0f766e]/6 shadow-[inset_0_0_0_1px_rgba(15,118,110,0.2)]"
                  : "border-border/80 bg-[#f8faf8]",
              )}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-[1.4rem] bg-[#0f766e]/12 text-[#0f766e]">
                  <ImagePlus className="size-8" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Tarik file ke sini
                  </h2>
                  <p className="text-muted-foreground text-sm leading-6 sm:text-base">
                    Cocok untuk converter cepat saat kamu perlu ganti format
                    foto tanpa ribet buka editor lain.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  <Label
                    className="bg-primary text-primary-foreground inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-sm transition-transform hover:-translate-y-0.5"
                    htmlFor={inputId}
                  >
                    <Upload className="size-4" />
                    Upload Gambar
                  </Label>
                  <Badge variant="outline">
                    Maks. {MAX_FILE_SIZE_MB} MB / file
                  </Badge>
                </div>

                <p className="text-muted-foreground max-w-lg text-xs leading-6 sm:text-sm">
                  Mendukung {INPUT_EXTENSIONS.join(", ")} dan akan otomatis
                  mengemas hasilnya ke ZIP kalau kamu mengunggah lebih dari satu
                  file.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">Queue konversi</h3>
                  <p className="text-muted-foreground text-sm">
                    File akan tetap di daftar sampai kamu hapus sendiri.
                  </p>
                </div>
                <Button
                  disabled={!selectedFiles.length || isConverting}
                  onClick={clearFiles}
                  type="button"
                  variant="ghost"
                >
                  <Trash2 />
                  Kosongkan
                </Button>
              </div>

              {selectedFiles.length ? (
                <div className="grid max-h-[30rem] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                  {selectedFiles.map((entry) => (
                    <div
                      className="border-border/70 rounded-[1.4rem] border bg-white/80 p-3 shadow-sm"
                      key={entry.id}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem] bg-gradient-to-br from-[#0f766e]/12 via-white to-[#fb923c]/18">
                          <FileImage className="size-6 text-[#0f766e]" />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                            src={entry.previewUrl}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {entry.file.name}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {entry.sizeLabel} • {entry.extension}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="outline">Siap diproses</Badge>
                            <Badge variant="secondary">
                              {outputFormat.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          aria-label={`Hapus ${entry.file.name}`}
                          onClick={() => removeFile(entry.id)}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <X />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-border/80 bg-muted/40 rounded-[1.4rem] border border-dashed px-5 py-10 text-center">
                  <Sparkles className="mx-auto mb-3 size-6 text-[#0f766e]" />
                  <p className="font-medium">Belum ada file di antrean.</p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Begitu file masuk, preview singkatnya akan muncul di sini.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/70 bg-white/85 shadow-[0_26px_70px_-44px_rgba(15,23,42,0.48)] backdrop-blur">
            <CardHeader className="gap-3">
              <CardTitle className="text-xl">Pengaturan output</CardTitle>
              <CardDescription>
                Pilih format akhir yang paling sesuai dengan kebutuhanmu.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="format-output">Format akhir</Label>
                <Select
                  onValueChange={(value) =>
                    setOutputFormat(value as OutputFormat)
                  }
                  value={outputFormat}
                >
                  <SelectTrigger className="w-full" id="format-output">
                    <SelectValue placeholder="Pilih format output" />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTPUT_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{format.label}</span>
                          <span className="text-muted-foreground text-xs">
                            {format.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-sm">
                  {activeFormat.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label>Kualitas</Label>
                  <Badge variant="outline">{qualityValue}%</Badge>
                </div>
                <Slider
                  disabled={!isQualityEnabled}
                  max={100}
                  min={55}
                  onValueChange={(value) =>
                    setQuality(Array.isArray(value) ? [...value] : [value])
                  }
                  step={1}
                  value={quality}
                />
                <p className="text-muted-foreground text-sm leading-6">
                  {isQualityEnabled
                    ? "Semakin tinggi nilainya, hasil akan lebih tajam dengan ukuran file yang ikut naik."
                    : "PNG diekspor lossless, jadi slider kualitas tidak dipakai di format ini."}
                </p>
              </div>

              <Separator />

              <div className="grid gap-3">
                <div className="border-border/70 bg-muted/35 flex items-start gap-3 rounded-[1.2rem] border p-4">
                  <ScanSearch className="mt-0.5 size-5 text-[#0f766e]" />
                  <div>
                    <p className="font-medium">
                      Preview ringkas sebelum convert
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Cek nama file, ukuran, dan antreannya tanpa pindah layar.
                    </p>
                  </div>
                </div>

                <div className="border-border/70 bg-muted/35 flex items-start gap-3 rounded-[1.2rem] border p-4">
                  <FileArchive className="mt-0.5 size-5 text-[#0f766e]" />
                  <div>
                    <p className="font-medium">
                      {batchWillZip
                        ? "Hasil batch akan dibungkus ZIP."
                        : "Satu file akan langsung didownload."}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {batchWillZip
                        ? "Praktis buat pindah banyak gambar sekaligus."
                        : "Pas untuk kebutuhan convert cepat satu gambar."}
                    </p>
                  </div>
                </div>

                <div className="border-border/70 bg-muted/35 flex items-start gap-3 rounded-[1.2rem] border p-4">
                  <WandSparkles className="mt-0.5 size-5 text-[#0f766e]" />
                  <div>
                    <p className="font-medium">
                      Server-side converter dengan sharp
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Lebih fleksibel daripada hanya mengandalkan browser
                      canvas.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-3 sm:flex-row">
              <Button
                className="w-full sm:flex-1"
                disabled={!selectedFiles.length || isConverting}
                onClick={handleConvert}
                size="lg"
                type="button"
              >
                {isConverting ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <ArrowRightLeft />
                )}
                {isConverting ? "Mengonversi..." : "Convert & Download"}
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={!selectedFiles.length || isConverting}
                onClick={clearFiles}
                size="lg"
                type="button"
                variant="outline"
              >
                <Trash2 />
                Reset
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-white/70 bg-white/85 shadow-[0_26px_70px_-44px_rgba(15,23,42,0.48)] backdrop-blur">
            <CardHeader className="gap-3">
              <CardTitle className="text-xl">
                Yang sudah disiapkan di project
              </CardTitle>
              <CardDescription>
                Stack dan pengalaman pakai sudah dirapikan supaya siap
                dilanjutkan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 text-[#0f766e]" />
                <p className="text-muted-foreground text-sm leading-6">
                  UI dibangun dengan{" "}
                  <span className="text-foreground font-medium">shadcn-ui</span>
                  , icon dari{" "}
                  <span className="text-foreground font-medium">
                    {" "}
                    lucide-react
                  </span>
                  , dan notifikasi pakai{" "}
                  <span className="text-foreground font-medium">
                    {" "}
                    React Toastify
                  </span>
                  .
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 text-[#0f766e]" />
                <p className="text-muted-foreground text-sm leading-6">
                  Konfigurasi{" "}
                  <span className="text-foreground font-medium">ESLint</span>{" "}
                  dan
                  <span className="text-foreground font-medium">
                    {" "}
                    Prettier
                  </span>{" "}
                  sudah aktif untuk menjaga codebase tetap rapi.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 text-[#0f766e]" />
                <p className="text-muted-foreground text-sm leading-6">
                  Input umum seperti {INPUT_EXTENSIONS.slice(0, 6).join(", ")}{" "}
                  dan format lain yang sejenis sudah disiapkan di alur upload.
                </p>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                {INPUT_EXTENSIONS.map((extension) => (
                  <Badge key={extension} variant="outline">
                    {extension}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
