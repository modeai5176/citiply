"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, ImageIcon, UploadCloud } from "lucide-react";
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
  // Local blob preview shows instantly and bridges the gap until the uploaded URL arrives.
  const [localPreview, setLocalPreview] = useState("");
  // Re-uploads reuse the same S3 key, so bust the browser cache to show the new file.
  const [version, setVersion] = useState(0);

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  async function upload(file: File) {
    setUploading(true);
    setError("");
    if (type === "image") setLocalPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    formData.append("filename", filename || "file");
    formData.append("type", type);

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const json = (await response.json().catch(() => ({}))) as UploadResponse;
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (!response.ok) {
      setLocalPreview("");
      setError(json.error ?? "Upload failed");
      return;
    }

    setVersion(Date.now());
    if (onUploaded) {
      onUploaded(json);
    } else {
      onChange(type === "pdf" ? json.url ?? "" : json.imageUrl ?? "");
    }
    setLocalPreview("");
  }

  const previewSrc = localPreview || (value && version ? `${value}${value.includes("?") ? "&" : "?"}v=${version}` : value);

  return (
    <div className="rounded-xl border border-dashed border-border bg-white p-3">
      {type === "image" ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative mb-3 grid aspect-[4/3] w-full cursor-pointer place-items-center overflow-hidden rounded-lg bg-surface text-text-muted transition hover:opacity-90"
          aria-label={previewSrc ? "Replace image" : "Upload image"}
        >
          {previewSrc ? (
            // Plain img: admin previews can come from blob: URLs or hosts not whitelisted for next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="Uploaded preview" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="grid justify-items-center gap-2 text-xs">
              <ImageIcon className="h-8 w-8" />
              No image yet
            </span>
          )}
          {uploading ? <span className="absolute inset-0 grid place-items-center bg-black/40 text-sm font-medium text-white">Uploading...</span> : null}
        </button>
      ) : null}
      {value && type === "pdf" ? (
        <a href={value} target="_blank" rel="noreferrer" className="mb-3 flex items-center gap-2 truncate rounded-lg bg-surface px-3 py-2 text-sm text-text-secondary hover:text-accent">
          <FileText className="h-4 w-4 shrink-0" />
          <span className="truncate">{value.split("/").pop()}</span>
        </a>
      ) : null}
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
        <Button type="button" variant="ghost" className="px-4 py-2 text-text-primary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <UploadCloud className="h-4 w-4" />
          {uploading ? "Uploading..." : value ? "Replace" : type === "pdf" ? "Upload PDF" : "Upload Image"}
        </Button>
        {value && !uploading ? <button type="button" className="cursor-pointer text-sm text-red-600" onClick={() => { setLocalPreview(""); onChange(""); }}>Remove</button> : null}
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
