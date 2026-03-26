# 🖼️ Image Converter

![Next.js](https://img.shields.io/badge/Next.js-16.2.1-111111?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.4-149ECA?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-base--nova-0F766E?style=for-the-badge&logo=shadcnui&logoColor=white)
![Sharp](https://img.shields.io/badge/Sharp-Server%20Converter-F97316?style=for-the-badge)
![Toastify](https://img.shields.io/badge/React%20Toastify-Notifications-FF6B6B?style=for-the-badge)
![ESLint](https://img.shields.io/badge/ESLint-Checked-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-Formatted-F7B93E?style=for-the-badge&logo=prettier&logoColor=111111)

## 🌈 About The Project

Image Converter is a **Next.js** application for converting images into popular formats such as **JPG, PNG, WEBP, AVIF,** and **TIFF**.

It uses:

- **shadcn-ui** for the interface
- **lucide-react** for icons
- **React Toastify** for notifications
- **sharp** for server-side image processing

This project is useful for:

- converting a single image quickly
- converting many images in one batch
- downloading a single converted file or an automatic ZIP archive for multi-file jobs
- keeping the front-end experience simple while handling the heavy conversion work on the server

## ✨ Main Features

- Image upload via file picker or drag-and-drop
- Supports common input formats such as `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.bmp`, `.tiff`, `.avif`, `.svg`, `.heic`, and `.heif`
- Converts output to `JPG`, `PNG`, `WEBP`, `AVIF`, and `TIFF`
- **Unlimited** batch conversion by file count
- Multi-file results are automatically downloaded as `.zip`
- Queue preview before conversion
- Quality slider for lossy formats
- Modern UI built with `shadcn-ui`
- Success and error notifications using `React Toastify`
- Ready-to-use `ESLint` and `Prettier` setup

## 🧰 Tech Stack

- **Framework**: Next.js 16 App Router
- **UI**: React 19, shadcn-ui, Tailwind CSS v4
- **Icons**: lucide-react
- **Notifications**: React Toastify
- **Image Processing**: sharp
- **ZIP Packaging**: JSZip
- **Linting**: ESLint
- **Formatting**: Prettier + `prettier-plugin-tailwindcss`
- **Language**: TypeScript

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start development mode

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

### 3. Build for production

```bash
npm run build
npm run start
```

### 4. Useful tooling scripts

```bash
npm run lint
npm run format
npm run format:check
```

## 🧠 How It Works

1. The user uploads one or more image files from the main page.
2. The front-end builds a `FormData` payload containing the files, target format, and quality.
3. The request is sent to `POST /api/convert`.
4. The server processes each image using `sharp`.
5. If there is only one result, the server returns the converted file directly.
6. If there are multiple results, the server bundles them into a ZIP file using `JSZip`.
7. The front-end triggers the download automatically and shows toast notifications for the result.

## 🗂️ Project Structure

> The tree below reflects the current project structure in this repository.  
> Generated/internal folders such as `.git`, `.next`, and `node_modules` are shown at folder level because their contents are created automatically.

```text
📦 Image Converter
├── 📁 .git/                             # Git repository metadata
├── 📁 .next/                            # Next.js generated cache and build output
├── 📁 node_modules/                     # Installed npm dependencies
├── 📁 public/                           # Static assets served directly by Next.js
│   ├── 🖼️ file.svg                      # Default SVG asset from the initial scaffold
│   ├── 🖼️ globe.svg                     # Decorative scaffold SVG asset
│   ├── 🖼️ next.svg                      # Next.js logo asset
│   ├── 🖼️ vercel.svg                    # Vercel logo asset
│   └── 🖼️ window.svg                    # Extra scaffold SVG asset
├── 📁 src/                              # Main application source code
│   ├── 📁 app/                          # Next.js App Router files: pages, layouts, route handlers
│   │   ├── 📁 api/                      # Server-side API routes
│   │   │   └── 📁 convert/              # Image conversion endpoint
│   │   │       └── 📄 route.ts          # POST handler for image conversion and ZIP generation
│   │   ├── 🖼️ favicon.ico               # Browser tab icon for the application
│   │   ├── 🎨 globals.css               # Global styles, color tokens, background, and Toastify styling
│   │   ├── 📄 layout.tsx                # Root layout, metadata, font setup, and toast provider mounting
│   │   └── 📄 page.tsx                  # Main homepage rendering the image converter UI
│   ├── 📁 components/                   # Reusable React components
│   │   ├── 📁 ui/                       # shadcn-ui primitives used across the app
│   │   │   ├── 📄 badge.tsx             # Reusable badge component
│   │   │   ├── 📄 button.tsx            # Reusable button component
│   │   │   ├── 📄 card.tsx              # Reusable card/container component
│   │   │   ├── 📄 input.tsx             # Reusable input component
│   │   │   ├── 📄 label.tsx             # Reusable form label component
│   │   │   ├── 📄 select.tsx            # Reusable select/dropdown component
│   │   │   ├── 📄 separator.tsx         # Reusable visual separator component
│   │   │   └── 📄 slider.tsx            # Reusable slider component for quality control
│   │   ├── 📄 image-converter.tsx       # Main upload, preview, queue, and conversion UI
│   │   └── 📄 toast-provider.tsx        # React Toastify container wrapper
│   └── 📁 lib/                          # Shared utilities and constants
│       ├── 📄 image-formats.ts          # Supported image formats, MIME map, and size limits
│       └── 📄 utils.ts                  # `cn()` helper for merging Tailwind and clsx classes
├── ⚙️ .gitignore                        # Git ignore rules
├── ⚙️ .prettierignore                   # Prettier ignore rules
├── ⚙️ components.json                   # shadcn-ui project configuration
├── ⚙️ eslint.config.mjs                 # ESLint configuration
├── ⚙️ next-env.d.ts                     # Next.js TypeScript environment declarations
├── ⚙️ next.config.ts                    # Next.js configuration file
├── 📦 package-lock.json                 # npm lockfile
├── ⚙️ package.json                      # Project scripts, dependencies, and metadata
├── ⚙️ postcss.config.mjs                # PostCSS configuration for Tailwind CSS
├── 📝 prettier.config.mjs               # Prettier configuration
├── 📝 README.md                         # Project documentation
└── ⚙️ tsconfig.json                     # TypeScript configuration
```

## 🎯 Important Folder Notes

### `src/app/`

This is the heart of the Next.js App Router setup.

It contains:

- `layout.tsx` for the global application shell
- `page.tsx` for the main page
- `api/convert/route.ts` for the server-side conversion endpoint

### `src/components/`

This folder contains the React components used by the UI.

- `image-converter.tsx` is the core application component
- `toast-provider.tsx` mounts the notification container
- `ui/` stores reusable primitives generated and adapted from `shadcn-ui`

### `src/lib/`

This folder stores helper functions and shared constants.

- `image-formats.ts` defines supported formats and related metadata
- `utils.ts` provides class merging helpers for cleaner Tailwind usage

### `public/`

This folder contains static assets that can be served directly by the browser without special processing.

### `.next/`

This is the Next.js build output folder.

It is generated automatically during development and production builds, so it is not intended for manual editing.

### `node_modules/`

This folder contains all installed npm packages.

It is automatically created by npm and should not be edited manually.

## 🛠️ NPM Scripts

| Script                 | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Starts the application in development mode            |
| `npm run build`        | Builds the application for production                 |
| `npm run start`        | Runs the production build                             |
| `npm run lint`         | Runs ESLint to check code quality                     |
| `npm run format`       | Formats files with Prettier                           |
| `npm run format:check` | Checks whether files already match the Prettier rules |

## 📌 Technical Notes

- Batch conversion is now **unlimited by file count**
- The active limit is still **25 MB per file**
- If more than one file is converted, the result is automatically packaged as a ZIP archive
- Conversion happens in a Next.js server route for better format support and more reliable processing

## 💡 Future Improvement Ideas

- add resize mode
- add compress-only mode
- add a dark mode switcher
- add drag-to-sort queue support
- add conversion history
- add per-format quality presets

## 🧡 Final Note

This README is designed to make the project structure easier to understand as the app grows.

If you add new features later, update the **Features**, **NPM Scripts**, and **Project Structure** sections so the documentation stays in sync with the codebase.
