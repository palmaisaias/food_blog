import { ArrowDown, ArrowUpRight, ChefHat, Clock3, UsersRound } from "lucide-react";
import Link from "next/link";
import { FoodPhoto } from "@/components/photo";
import { issueNumber, publicationDate, type Recipe } from "@/lib/model";

export function RecipeMeta({ recipe }: { recipe: Recipe }) {
  return <dl className="recipe-meta">
    <div><dt><Clock3 size={17} aria-hidden="true" /> Total time</dt><dd>{recipe.prep + recipe.cook} min</dd></div>
    <div><dt><UsersRound size={17} aria-hidden="true" /> Serves</dt><dd>{recipe.servings} people</dd></div>
    <div><dt><ChefHat size={17} aria-hidden="true" /> Difficulty</dt><dd>{recipe.difficulty}</dd></div>
  </dl>;
}

export function RecipeHero({ recipe, featured, sample }: { recipe: Recipe; featured?: boolean; sample: boolean }) {
  const isSampleHero = recipe.id === "demo-lemon-chicken";
  return <section className="feature page-wrap" aria-labelledby="feature-title">
    {!featured && <Link className="archive-back text-link" href="/archive">Recipe archive <ArrowUpRight size={15} aria-hidden="true" /></Link>}
    <div className="feature-grid">
      <div className="feature-copy">
        <div className="feature-kicker"><span className="kicker-line" /><span className="eyebrow">{featured ? "This week at the table" : "From the recipe archive"}</span></div>
        <div className="feature-date"><span>Week {issueNumber(recipe.issue)}</span><span className="meta-dot" /><time dateTime={recipe.publishedAt ?? undefined}>{publicationDate(recipe.publishedAt, { weekday: "long", month: "long", day: "numeric" })}</time></div>
        <h1 id="feature-title" className="feature-title" aria-label={isSampleHero ? recipe.title : undefined}>
          {isSampleHero ? <>Crispy Lemon<br className="hero-break" /> Chicken <em>&amp;</em><br className="hero-break" /> <em>Potatoes</em></> : recipe.title}
        </h1>
        <p className="feature-intro">{recipe.intro}</p>
        <a className="button button-red feature-action" href="#the-recipe">Let’s cook <ArrowDown size={17} aria-hidden="true" /></a>
      </div>
      {recipe.cover && <figure className="feature-figure">
        <div className="feature-image"><FoodPhoto photo={recipe.cover} priority sizes="(max-width: 780px) 94vw, (max-width: 1250px) 57vw, 720px" /></div>
        <figcaption className="feature-caption">
          <span>{sample ? "Sample recipe photography" : recipe.cover.caption || recipe.category}</span>
          <span>From the Tuesday Table</span>
        </figcaption>
      </figure>}
    </div>
    <RecipeMeta recipe={recipe} />
  </section>;
}
