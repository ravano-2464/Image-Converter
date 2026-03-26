import { ImageConverter } from "@/components/image-converter";

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute top-[-8rem] left-[-8rem] size-80 rounded-full bg-[#0f766e]/18 blur-3xl" />
      <div className="pointer-events-none absolute top-16 right-[-10rem] size-96 rounded-full bg-[#fb923c]/18 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/70 via-white/20 to-transparent" />
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <ImageConverter />
      </div>
    </main>
  );
}
