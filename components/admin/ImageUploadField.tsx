"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";

type UploadResponse = {
  imageUrl?: string;
  thumbnailUrl?: string;
  blurDataUrl?: string;
  url?: string;
  error?: string;
};

export function ImageUploadField({
  value,
  onChange,
  folder,
  filename,
  type = "image",
  onUploaded
}: {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  filename: string;
  type?: "image" | "pdf";
  onUploaded?: (payload: UploadResponse) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    formData.append("filename", filename || "file");
    formData.append("type", type);

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const json = (await response.json()) as UploadResponse;
    setUploading(false);

    if (!response.ok) {
      setError(json.error ?? "Upload failed");
      return;
    }

    if (onUploaded) {
      onUploaded(json);
      return;
    }
    onChange(type === "pdf" ? json.url ?? "" : json.imageUrl ?? "");
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-4">
      {value && type === "image" ? (
        <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-lg bg-white">
          <Image src={value} alt="Uploaded preview" fill sizes="480px" className="object-cover" />
        </div>
      ) : null}
      {value && type === "pdf" ? <p className="mb-3 truncate rounded-lg bg-white px-3 py-2 text-sm text-text-secondary">{value}</p> : null}
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept={type === "pdf" ? "application/pdf" : "image/*"}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <UploadCloud className="h-4 w-4" />
          {uploading ? "Uploading..." : type === "pdf" ? "Upload PDF" : "Upload Image"}
        </Button>
        {value ? <button type="button" className="text-sm text-red-600" onClick={() => onChange("")}>Remove</button> : null}
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
