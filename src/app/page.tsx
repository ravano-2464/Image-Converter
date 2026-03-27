import { CustomScrollShell } from "@/components/custom-scroll-shell";
import { ImageConverter } from "@/components/image-converter";

export default function Home() {
  return (
    <CustomScrollShell page>
      <main className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(15,118,110,0.12),transparent_30%),radial-gradient(circle_at_86%_12%,rgba(251,146,60,0.08),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.28),transparent_44%)] dark:bg-[radial-gradient(circle_at_12%_10%,rgba(45,212,191,0.1),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(251,146,60,0.05),transparent_20%),linear-gradient(180deg,rgba(8,15,24,0.34),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.06] dark:opacity-[0.04]" />
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <ImageConverter />
        </div>
      </main>
    </CustomScrollShell>
  );
}
