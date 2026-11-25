import Link from "next/link";
import { RecipeSpread } from "@/components/recipe-spread";
import { featuredRecipe } from "@/lib/recipes";
import { hasSupabase } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function Home() {
  const recipe = await featuredRecipe();
  if (!recipe) return <section className="page-wrap empty-home">
    <p className="eyebrow section-kicker"><span /> The Tuesday Table</p>
    <h1>Pull up a <em>chair.</em></h1>
    <p>Three adults attempting to feed themselves. The first Tuesday recipe is still in the works.</p>
    <Link className="button button-red" href="/about">Meet the cooks</Link>
  </section>;
  return <RecipeSpread recipe={recipe} featured sample={!hasSupabase} />;
}
