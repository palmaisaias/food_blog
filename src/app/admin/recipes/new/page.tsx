import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { adminSession } from "@/lib/supabase";
import { RecipeEditor } from "../editor";

export default async function NewRecipe() {
  if (!await adminSession()) redirect("/admin/login");
  return <RecipeEditor id={randomUUID()} />;
}
