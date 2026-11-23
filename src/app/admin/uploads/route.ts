import { randomUUID } from "node:crypto";
import { fileType } from "@/lib/upload-rules";
import sharp from "sharp";
import { z } from "zod";
import { adminSession } from "@/lib/supabase";
import { bucket } from "@/lib/media";

const maxUpload = 4_000_000;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const allowedOrigin = [new URL(request.url).host, request.headers.get("host")];
  if (origin && !allowedOrigin.includes(new URL(origin).host)) return Response.json({ error: "Upload from the recipe editor." }, { status: 403 });
  const database = await adminSession();
  if (!database) return Response.json({ error: "Sign in again to upload photographs." }, { status: 401 });
  if (Number(request.headers.get("content-length")) > maxUpload + 25_000) return Response.json({ error: "This photograph is too large to upload." }, { status: 413 });
  const form = await request.formData().catch(() => null);
  const id = z.uuid().safeParse(form?.get("recipeId"));
  const file = form?.get("photo");
  if (!id.success || !(file instanceof File) || !file.size || file.size > maxUpload) {
    return Response.json({ error: "Select a photo under 4 MB after compression." }, { status: 400 });
  }
  let bytes: Buffer;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 42_000_000 });
    const info = await image.metadata();
    if (!info.format || !fileType.includes(info.format) || (info.pages ?? 1) > 1) throw new Error("Invalid image type");
    bytes = await image.rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    if (bytes.length > maxUpload) throw new Error("Image is too large");
  } catch {
    return Response.json({ error: "Choose a readable JPG, PNG, WebP, or AVIF photograph." }, { status: 400 });
  }
  const path = `${id.data}/${randomUUID()}.webp`;
  const { error } = await database.storage.from(bucket).upload(path, bytes, { contentType: "image/webp", cacheControl: "0", upsert: false });
  if (error) {
    console.error("Recipe upload failed", error);
    return Response.json({ error: "The photograph couldn’t be stored. Try again." }, { status: 500 });
  }
  return Response.json({ path, alt: "", caption: "" }, { status: 201 });
}
