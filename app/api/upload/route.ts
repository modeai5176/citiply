import { NextResponse, type NextRequest } from "next/server";
import { processAndUploadImage, uploadToS3 } from "@/lib/s3";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? formData.get("scope") ?? "uploads");
    const filename = String(formData.get("filename") ?? formData.get("key") ?? crypto.randomUUID());
    const type = String(formData.get("type") ?? "image");

    if (!(file instanceof File)) return NextResponse.json({ error: "File is required" }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());

    if (type === "pdf" || file.type === "application/pdf") {
      const url = await uploadToS3(buffer, `${folder}/${filename}.pdf`, "application/pdf");
      return NextResponse.json({ url, file_url: url });
    }

    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only images and PDFs are supported" }, { status: 400 });

    const result = await processAndUploadImage(buffer, folder, filename);
    return NextResponse.json({
      ...result,
      image_url: result.imageUrl,
      thumbnail_url: result.thumbnailUrl,
      blur_data_url: result.blurDataUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
