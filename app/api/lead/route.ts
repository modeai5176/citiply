import { NextResponse, type NextRequest } from "next/server";
import { uploadToS3 } from "@/lib/s3";
import { saveProjectLead } from "@/lib/supabase/leads";
import { sendLeadEmail } from "@/lib/email";
import { projectBriefSchema } from "@/lib/validations";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const parsed = projectBriefSchema.safeParse({
      projectType: formData.get("projectType") || undefined,
      city: formData.get("city") || undefined,
      requiredMaterials: formData.get("requiredMaterials") || undefined,
      finishMood: formData.get("finishMood") || undefined,
      timeline: formData.get("timeline") || undefined,
      phone: formData.get("phone") || "",
      email: formData.get("email") || ""
    });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    // Optional attachment — mood board / BOQ / drawings.
    let attachmentUrl: string | null = null;
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "File must be under 10 MB" }, { status: 400 });
      if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Only PDF and image files are supported" }, { status: 400 });

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
      attachmentUrl = await uploadToS3(buffer, `leads/${crypto.randomUUID()}.${ext}`, file.type);
    }

    await saveProjectLead({
      project_type: parsed.data.projectType || null,
      city: parsed.data.city || null,
      required_materials: parsed.data.requiredMaterials || null,
      finish_mood: parsed.data.finishMood || null,
      timeline: parsed.data.timeline || null,
      attachment_url: attachmentUrl,
      phone: parsed.data.phone,
      email: parsed.data.email,
      status: "pending"
    });

    await sendLeadEmail(parsed.data, attachmentUrl);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
