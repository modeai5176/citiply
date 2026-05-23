import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

export type ProcessedImage = {
  imageUrl: string;
  thumbnailUrl: string;
  blurDataUrl: string;
};

export const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "ap-south-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    : undefined
});

export function getS3BaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_S3_BASE_URL is not configured");
  return baseUrl.replace(/\/$/, "");
}

export async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error("AWS_S3_BUCKET is not configured");

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
  );

  return `${getS3BaseUrl()}/${key}`;
}

export async function deleteFromS3(key: string): Promise<void> {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error("AWS_S3_BUCKET is not configured");

  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function processAndUploadImage(fileBuffer: Buffer, folder: string, filename: string): Promise<ProcessedImage> {
  const mainBuffer = await sharp(fileBuffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  const imageUrl = await uploadToS3(mainBuffer, `${folder}/${filename}.webp`, "image/webp");

  const thumbBuffer = await sharp(fileBuffer)
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const thumbnailUrl = await uploadToS3(thumbBuffer, `${folder}/${filename}_thumb.webp`, "image/webp");

  const blurBuffer = await sharp(fileBuffer)
    .resize({ width: 20, withoutEnlargement: true })
    .webp({ quality: 60 })
    .toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString("base64")}`;

  return { imageUrl, thumbnailUrl, blurDataUrl };
}
