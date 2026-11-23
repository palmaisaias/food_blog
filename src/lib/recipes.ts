import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { demoRecipes } from "./demo";
import type { Category, Difficulty, KitchenId, Photo, Recipe, RecipeSummary, Status } from "./model";
import { publicClient } from "./supabase";

type ImageRow = { position: number; object_path: string; alt: string; caption: string };
type BaseRow = {
  id: string; issue: number; slug: string; title: string; intro: string; category: Category; difficulty: Difficulty;
  prep: number; cook: number; servings: number; status: Status; published_at: string | null; version: number;
  recipe_images: ImageRow[];
};
type FullRow = BaseRow & {
  notes: string; substitutions: string;
  recipe_ingredients: { position: number; amount: number | null; unit: string; name: string; note: string }[];
  recipe_instructions: { position: number; title: string; body: string }[];
  participant_submissions: { participant_id: KitchenId; comment: string; cooked_on: string | null; submission_photographs: ImageRow[] }[];
};
type SummaryRow = BaseRow & { participant_submissions: { cooked_on: string | null; comment: string; submission_photographs: { position: number }[] }[] };

const base = "id,issue,slug,title,intro,category,difficulty,prep,cook,servings,status,published_at,version";
const summaryColumns = `${base},recipe_images(position,object_path,alt,caption),participant_submissions(cooked_on,comment,submission_photographs(position))`;
const fullColumns = `${base},notes,substitutions,recipe_images(position,object_path,alt,caption),recipe_ingredients(position,amount,unit,name,note),recipe_instructions(position,title,body),participant_submissions(participant_id,comment,cooked_on,submission_photographs(position,object_path,alt,caption))`;

function photo(row?: ImageRow): Photo | null {
  return row ? { path: row.object_path, alt: row.alt, caption: row.caption } : null;
}

function toBase(row: BaseRow) {
  return {
    id: row.id, issue: row.issue, slug: row.slug, title: row.title, intro: row.intro, category: row.category,
    difficulty: row.difficulty, prep: row.prep, cook: row.cook, servings: row.servings,
    status: row.status, version: row.version, publishedAt: row.published_at,
    cover: photo(row.recipe_images.find((item) => item.position === 0)),
  };
}

const ordered = <T extends { position: number }>(items: T[]) => items.toSorted((a, b) => a.position - b.position);

function toFull(row: FullRow): Recipe {
  const { recipe_ingredients, recipe_instructions, participant_submissions, notes, substitutions } = row;
  return {
    ...toBase(row), notes, substitutions,
    ingredients: ordered(recipe_ingredients).map(({ amount, unit, name, note }) => ({ amount, unit, name, note })),
    steps: ordered(recipe_instructions).map((step) => ({
      title: step.title, body: step.body, photo: photo(row.recipe_images.find((image) => image.position === step.position)),
    })),
    submissions: participant_submissions.map((entry) => ({
      kitchen: entry.participant_id, comment: entry.comment, cookedOn: entry.cooked_on,
      photos: ordered(entry.submission_photographs).map(({ object_path, alt, caption }) => ({ path: object_path, alt, caption })),
    })),
  };
}

export async function listRecipes(client?: SupabaseClient): Promise<RecipeSummary[]> {
  const database = client ?? publicClient();
  if (!database) return demoRecipes.map((recipe) => ({
    id: recipe.id, issue: recipe.issue, slug: recipe.slug, title: recipe.title, intro: recipe.intro,
    category: recipe.category, difficulty: recipe.difficulty, prep: recipe.prep, cook: recipe.cook,
    servings: recipe.servings, status: recipe.status, version: recipe.version, cover: recipe.cover,
    publishedAt: recipe.publishedAt, completed: recipe.submissions.length,
  }));
  const rows: SummaryRow[] = [];
  const pageSize = 200;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await database.from("recipes").select(summaryColumns).eq("recipe_images.position", 0)
      .order(client ? "updated_at" : "published_at", { ascending: false }).order("issue", { ascending: false })
      .range(offset, offset + pageSize - 1).returns<SummaryRow[]>();
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows.map(({ participant_submissions, ...row }) => ({
    ...toBase(row),
    completed: participant_submissions.filter((entry) => entry.cooked_on || entry.comment || entry.submission_photographs.length).length,
  }));
}

export const recipeBySlug = cache(async (slug: string): Promise<Recipe | null> => {
  const database = publicClient();
  if (!database) return demoRecipes.find((recipe) => recipe.slug === slug) ?? null;
  const { data, error } = await database.from("recipes").select(fullColumns).eq("slug", slug).maybeSingle<FullRow>();
  if (error) throw error;
  return data ? toFull(data) : null;
});

export async function featuredRecipe() {
  const database = publicClient();
  if (!database) return demoRecipes[0];
  const { data, error } = await database.from("recipes").select(fullColumns)
    .order("published_at", { ascending: false }).order("issue", { ascending: false }).limit(1).maybeSingle<FullRow>();
  if (error) throw error;
  return data ? toFull(data) : null;
}

export async function adminRecipe(database: SupabaseClient, id: string) {
  const { data, error } = await database.from("recipes").select(fullColumns).eq("id", id).maybeSingle<FullRow>();
  if (error) throw error;
  return data ? toFull(data) : null;
}
