"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronDown, Clock3, Search, UsersRound } from "lucide-react";
import { useState } from "react";
import { categories, difficulties, issueNumber, publicationDate, type RecipeSummary } from "@/lib/model";
import { FoodPhoto } from "./photo";

export function ArchiveCard({ recipe }: { recipe: RecipeSummary }) {
  return <article className="archive-entry">
    <Link href={`/recipes/${recipe.slug}`} className="archive-entry-link">
      <div className="archive-photo">
        {recipe.cover && <FoodPhoto photo={recipe.cover} sizes="(max-width: 600px) 96vw, (max-width: 900px) 46vw, 570px" />}
        <span className="archive-issue">Week {issueNumber(recipe.issue)}</span>
      </div>
      <div className="archive-card-copy">
        <div className="archive-card-date"><time dateTime={recipe.publishedAt ?? undefined}>{publicationDate(recipe.publishedAt)}</time><span className="meta-dot" /> {recipe.category}</div>
        <div className="archive-title-line"><h2>{recipe.title}</h2><ArrowUpRight size={23} aria-hidden="true" /></div>
        <p>{recipe.intro}</p>
        <div className="archive-card-meta"><span>{recipe.difficulty}</span><span><Clock3 size={15} aria-hidden="true" /> {recipe.cook} min cook</span><span><UsersRound size={15} aria-hidden="true" /> {recipe.completed} of 3 cooked</span></div>
      </div>
    </Link>
  </article>;
}

export function ArchiveList({ recipes }: { recipes: RecipeSummary[] }) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const matches = recipes.filter((recipe) => recipe.title.toLowerCase().includes(search.trim().toLowerCase())
    && (!difficulty || recipe.difficulty === difficulty)
    && (!category || recipe.category === category));
  const results = sort === "oldest" ? matches.toReversed() : matches;

  if (!recipes.length) return <p className="archive-empty">The first recipe will appear here after we start...probs next week.</p>;

  return <>
    <form className="archive-filters" role="search" onSubmit={(event) => event.preventDefault()}>
      <label className="archive-search"><span>Search recipes</span><span className="search-input"><Search size={18} aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a recipe…" /></span></label>
      <label>Difficulty<span className="select-wrapper"><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="">All difficulties</option>{difficulties.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
      <label>Category<span className="select-wrapper"><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></span></label>
      <label>Sort by<span className="select-wrapper"><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select><ChevronDown size={16} aria-hidden="true" /></span></label>
    </form>
    <p className="results-count eyebrow" role="status">{results.length} {results.length === 1 ? "recipe" : "recipes"}</p>
    {results.length ? <div className="archive-grid">{results.map((recipe) => <ArchiveCard recipe={recipe} key={recipe.id} />)}</div> :
      <div className="archive-empty"><p>No recipes match those filters.</p><button className="text-link" type="button" onClick={() => { setSearch(""); setCategory(""); setDifficulty(""); }}>Clear filters</button></div>}
  </>;
}
