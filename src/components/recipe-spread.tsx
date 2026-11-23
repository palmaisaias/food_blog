import Link from "next/link";
import { BookOpen } from "lucide-react";
import { RecipeHero } from "./recipe-hero";
import { RecipeControls } from "./recipe-controls";
import { KitchenJournal } from "./journal";
import type { Recipe } from "@/lib/model";

export function SampleNotice() {
  return <span className="sample-notice">Sample journal</span>;
}

export function RecipeSpread({ recipe, featured, sample }: { recipe: Recipe; featured?: boolean; sample: boolean }) {
  return <>
    <RecipeHero recipe={recipe} featured={featured} sample={sample} />
    <RecipeControls key={recipe.id} recipe={recipe} />
    <KitchenJournal submissions={recipe.submissions} />
    <section className="page-wrap archive-prompt">
      <div><h2>More Tuesdays.</h2><p>Every recipe and the stories that came with it.</p></div>
      <Link className="button button-outline" href="/archive"><BookOpen size={19} aria-hidden="true" /> Browse the archive</Link>
    </section>
    {sample && <div className="page-wrap sample-footer"><SampleNotice /></div>}
  </>;
}
