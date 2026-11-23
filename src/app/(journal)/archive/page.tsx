import type { Metadata } from "next";
import { ArchiveList } from "@/components/archive-list";
import { SampleNotice } from "@/components/recipe-spread";
import { hasSupabase } from "@/lib/config";
import { listRecipes } from "@/lib/recipes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Recipe Archive", description: "The recipes we’ve made and what happened in each of our three kitchens.",
};

export default async function Archive() {
  const recipes = await listRecipes();
  return <div className="page-wrap archive-page">
    <header className="editorial-heading">
      <p className="eyebrow section-kicker"><span /> The collection</p>
      <h1>Recipe <em>Archive.</em></h1>
      <p>A growing record of dinners, discoveries, and what happened in each of our kitchens.</p>
      {!hasSupabase && <SampleNotice />}
    </header>
    <ArchiveList recipes={recipes} />
  </div>;
}
