import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { adminSession, publicClient } from "./supabase";

export const bucket = "recipe-photos";
export const photoPath = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.webp$/;
const widths = [320, 480, 640, 960, 1280, 1600, 1920];

export async function imageBuffer(client: SupabaseClient, path: string) {
  if (!photoPath.test(path)) return null;
  const { data } = await client.storage.from(bucket).download(path);
  return data ? Buffer.from(await data.arrayBuffer()) : null;
}

export async function servePhoto(request: Request, segments: string[], admin = false) {
  const path = segments.join("/");
  if (!photoPath.test(path)) return new Response(null, { status: 404 });

  const database = admin ? await adminSession() : publicClient();
  const input = database && await imageBuffer(database, path);
  if (!input) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  const width = Number(new URL(request.url).searchParams.get("w"));
  const data = widths.includes(width) && width < 1920
    ? await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
    : input;
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": admin ? "private, no-store" : "public, max-age=0, must-revalidate",
    },
  });
}
