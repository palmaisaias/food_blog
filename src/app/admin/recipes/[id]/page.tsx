import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { adminSession } from "@/lib/supabase";
import { adminRecipe } from "@/lib/recipes";
import { RecipeEditor } from "../editor";

export default async function EditRecipe({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const client = await adminSession();
  if (!client) redirect("/admin/login");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const recipe = await adminRecipe(client, id);
  if (!recipe) notFound();
  return <RecipeEditor id={id} initial={recipe} newlySaved={(await searchParams).saved === "1"} />;
}
