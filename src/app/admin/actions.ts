"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminSession, sessionClient } from "@/lib/supabase";
import { editorSchema, type EditorValues } from "@/lib/editor-schema";
import { adminRecipe } from "@/lib/recipes";
import { bucket } from "@/lib/media";
import type { Recipe } from "@/lib/model";

export async function signIn(_previous: string, form: FormData) {
  const parsed = z.object({ email: z.email(), password: z.string().min(1).max(4096) }).safeParse({
    email: String(form.get("email") ?? "").trim(), password: form.get("password"),
  });
  const client = await sessionClient();
  if (!client) return "Connect Supabase to sign in.";
  if (!parsed.success) return "Enter your email and password.";
  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error) return "That email and password didn’t work.";
  const { data } = await client.rpc("is_table_admin");
  if (!data) {
    await client.auth.signOut({ scope: "local" });
    return "This account does not have administrator access.";
  }
  redirect("/admin");
}

export async function signOut() {
  const client = await sessionClient();
  await client?.auth.signOut({ scope: "local" });
  redirect("/admin/login");
}

type SaveResult = { saved: true; version: number; issue: number; publishedAt: string | null; warning?: string } | { saved: false; errors: string[] };

const pathsFor = (recipe: Pick<Recipe, "cover" | "steps" | "submissions"> | null) => recipe
  ? [recipe.cover, ...recipe.steps.map((step) => step.photo), ...recipe.submissions.flatMap((entry) => entry.photos)].flatMap((photo) => photo ? [photo.path] : [])
  : [];

export async function saveRecipe(input: EditorValues): Promise<SaveResult> {
  const client = await adminSession();
  if (!client) return { saved: false, errors: ["Sign in again before saving."] };

  const result = editorSchema.safeParse(input);
  if (!result.success) return { saved: false, errors: [...new Set(result.error.issues.map((issue) => issue.message))] };
  const { id, version, ...payload } = result.data;
  const previous = version ? await adminRecipe(client, id) : null;

  const { data, error } = await client.rpc("save_table_recipe", { recipe_id: id, expected_version: version, payload })
    .single<{ version: number; issue: number; published_at: string | null }>();
  if (error) {
    switch (error.code) {
      case "23505": return { saved: false, errors: [version ? "That recipe link is already in use." : "That link is already in use or this recipe was saved. Check the dashboard before retrying."] };
      case "40001":
      case "22023": return { saved: false, errors: [error.message] };
      default:
        console.error("Recipe save failed", error);
        return { saved: false, errors: ["The recipe couldn’t be saved. Try again."] };
    }
  }

  const now = new Set(pathsFor(payload));
  const removed = [...new Set(pathsFor(previous))].filter((path) => !now.has(path));
  const cleanup = removed.length ? await client.storage.from(bucket).remove(removed) : null;

  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath(`/recipes/${payload.slug}`);
  if (previous?.slug && previous.slug !== payload.slug) revalidatePath(`/recipes/${previous.slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/recipes/${id}`);
  return {
    saved: true, version: data.version, issue: data.issue, publishedAt: data.published_at,
    warning: cleanup?.error ? "The recipe was saved. Supabase couldn’t remove the detached photo files." : undefined,
  };
}

export async function deleteRecipe(id: string, version: number) {
  const client = await adminSession();
  if (!client || !z.uuid().safeParse(id).success || !Number.isInteger(version) || version < 1) return "Sign in again before deleting.";
  const recipe = await adminRecipe(client, id);
  const { data, error } = await client.from("recipes").delete().eq("id", id).eq("version", version).select("id").maybeSingle();
  if (error) return "The recipe couldn’t be deleted.";
  if (!data) return "The recipe changed. Reload the editor before deleting.";
  const paths = [...new Set(pathsFor(recipe))];
  if (paths.length) {
    const { error: cleanupError } = await client.storage.from(bucket).remove(paths);
    if (cleanupError) console.error("Deleted recipe photo cleanup failed", cleanupError);
  }
  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath("/admin");
  if (recipe) revalidatePath(`/recipes/${recipe.slug}`);
  redirect("/admin?deleted=1");
}
