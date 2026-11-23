import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeSpread } from "@/components/recipe-spread";
import { hasSupabase } from "@/lib/config";
import { recipeBySlug } from "@/lib/recipes";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = await recipeBySlug((await params).slug);
  if (!recipe) return { title: "Recipe unavailable", robots: { index: false } };
  const url = `/recipes/${recipe.slug}`;
  const image = recipe.cover?.path.startsWith("/images/") ? recipe.cover.path.replace(".webp", "-share.jpg") : `${url}/share-image`;
  const images = recipe.cover ? [{ url: image, width: 1200, height: 630, alt: recipe.cover.alt, type: "image/jpeg" }] : undefined;
  return {
    title: recipe.title,
    description: recipe.intro,
    alternates: { canonical: url },
    openGraph: { title: recipe.title, description: recipe.intro, url, siteName: "The Tuesday Table", type: "article", publishedTime: recipe.publishedAt ?? undefined, images },
    twitter: { card: "summary_large_image", title: recipe.title, description: recipe.intro, images },
  };
}

export default async function RecipePage({ params }: Props) {
  const recipe = await recipeBySlug((await params).slug);
  if (!recipe) notFound();
  return <RecipeSpread recipe={recipe} sample={!hasSupabase} />;
}
