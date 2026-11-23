import { z } from "zod";
import { categories, difficulties, statuses, kitchens, pacificDay } from "./model";

const photo = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/),
  alt: z.string().trim().max(240),
  caption: z.string().trim().max(300),
});
const participantIds = kitchens.map((person) => person.id);

export const editorSchema = z.object({
  id: z.uuid(),
  version: z.number().int().nonnegative(),
  slug: z.string().trim().max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens for the recipe link."),
  title: z.string().trim().min(1, "Enter a recipe title.").max(140),
  intro: z.string().trim().max(2500),
  category: z.enum(categories),
  difficulty: z.enum(difficulties),
  prep: z.number().int().min(0).max(10080),
  cook: z.number().int().min(0).max(10080),
  servings: z.number().int().min(1).max(48),
  notes: z.string().trim().max(4000),
  substitutions: z.string().trim().max(4000),
  status: z.enum(statuses),
  scheduleDate: z.iso.date().or(z.literal("")),
  cover: photo.nullable(),
  ingredients: z.array(z.object({
    amount: z.number().finite().min(0).max(100000).nullable(),
    unit: z.string().trim().max(40),
    name: z.string().trim().min(1, "Enter an ingredient name.").max(160),
    note: z.string().trim().max(200),
  })).max(100),
  steps: z.array(z.object({
    title: z.string().trim().max(140),
    body: z.string().trim().min(1, "Each step needs instructions.").max(4000),
    photo: photo.nullable(),
  })).max(60),
  submissions: z.array(z.object({
    kitchen: z.enum(participantIds),
    comment: z.string().trim().max(4000),
    cookedOn: z.iso.date().nullable(),
    photos: z.array(photo).max(16),
  })).max(3),
}).superRefine((recipe, ctx) => {
  const message = (field: string, text: string) => ctx.addIssue({ code: "custom", path: [field], message: text });
  if (new Set(recipe.submissions.map((entry) => entry.kitchen)).size !== recipe.submissions.length) message("submissions", "Each kitchen can have one journal entry.");
  if (recipe.status === "draft") return;
  if (!recipe.intro) message("intro", "Add an introduction before publication.");
  if (!recipe.cover) message("cover", "Upload a cover photo before publication.");
  if (!recipe.ingredients.length) message("ingredients", "Add at least one ingredient before publication.");
  if (!recipe.steps.length) message("steps", "Add at least one cooking step before publication.");
  const photos = [recipe.cover, ...recipe.steps.map((step) => step.photo), ...recipe.submissions.flatMap((entry) => entry.photos)];
  if (photos.some((image) => image && !image.alt)) message("photos", "Add a short description for each uploaded image before publication.");
  if (recipe.status === "scheduled") {
    const date = new Date(`${recipe.scheduleDate}T12:00:00Z`);
    if (date.getUTCDay() !== 2 || recipe.scheduleDate <= pacificDay(new Date())) message("scheduleDate", "Choose a future Tuesday in Pacific time.");
  }
});

export type EditorValues = z.input<typeof editorSchema>;
