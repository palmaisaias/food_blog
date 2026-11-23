import sharp from "sharp";
import { recipeBySlug } from "@/lib/recipes";
import { imageBuffer } from "@/lib/media";
import { publicClient } from "@/lib/supabase";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const database = publicClient();
  const recipe = database && await recipeBySlug((await params).slug);
  const input = database && recipe?.cover && await imageBuffer(database, recipe.cover.path);
  if (!input) return new Response(null, { status: 404 });
  const output = await sharp(input).resize(1200, 630, { fit: "cover" }).jpeg({ quality: 86 }).toBuffer();
  return new Response(new Uint8Array(output), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=0, must-revalidate" },
  });
}
