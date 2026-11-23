import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { adminSession } from "@/lib/supabase";
import { listRecipes } from "@/lib/recipes";
import { effectiveStatus, issueNumber, publicationDate } from "@/lib/model";
import { signOut } from "./actions";

export default async function Admin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const client = await adminSession();
  if (!client) redirect("/admin/login");
  const [recipes, query] = await Promise.all([listRecipes(client), searchParams]);
  const counts = recipes.reduce((result, recipe) => {
    result[effectiveStatus(recipe)] += 1;
    return result;
  }, { published: 0, draft: 0, scheduled: 0 });
  return <>
    <header className="admin-title">
      <div><p className="eyebrow section-kicker"><span /> Administration</p><h1>Recipes<span className="red">.</span></h1></div>
      <div className="admin-actions"><form action={signOut}><button type="submit" className="button button-outline">Sign out</button></form>
        <Link className="button button-red" href="/admin/recipes/new"><Plus size={18} aria-hidden="true" /> New recipe</Link>
      </div>
    </header>
    {query.deleted && <p role="status" className="admin-notice">Recipe deleted.</p>}
    <ul className="admin-counts">{Object.entries(counts).map(([status, total]) => <li key={status}><strong>{total}</strong> {status}</li>)}</ul>
    {recipes.length ? <ul className="admin-list">{recipes.map((recipe) => {
      const status = effectiveStatus(recipe);
      return <li key={recipe.id}>
        <div><p className="eyebrow">Week {issueNumber(recipe.issue)}</p><Link href={`/admin/recipes/${recipe.id}`} className="admin-recipe-link">{recipe.title}</Link></div>
        <div className="admin-list-meta"><span className={`badge badge-${status}`}>{status}</span>{recipe.publishedAt && <time dateTime={recipe.publishedAt}>{publicationDate(recipe.publishedAt)}</time>}</div>
        <div className="admin-actions">{status === "published" && <Link className="text-link" href={`/recipes/${recipe.slug}`}>View recipe</Link>}<Link className="button button-outline" href={`/admin/recipes/${recipe.id}`}>Edit<span className="sr-only"> {recipe.title}</span></Link></div>
      </li>;
    })}</ul> : <p className="admin-notice">The journal is empty. Create a recipe to get the first Tuesday started.</p>}
  </>;
}
