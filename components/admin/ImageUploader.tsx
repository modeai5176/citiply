"use client";

import { UploadCloud } from "lucide-react";

export function ImageUploader() {
  return (
    <div className="grid min-h-44 place-items-center rounded-xl border border-dashed border-border bg-surface p-6 text-center">
      <div>
        <UploadCloud className="mx-auto h-8 w-8 text-accent" />
        <p className="mt-3 font-medium">Drag and drop images or PDFs</p>
        <p className="mt-1 text-sm text-text-secondary">Uploads route through Sharp and Amazon S3 when credentials are configured.</p>
      </div>
    </div>
  );
}
