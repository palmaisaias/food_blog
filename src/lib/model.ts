export const zone = "America/Los_Angeles";
export const difficulties = ["Easy", "Intermediate", "Project"] as const;
export const categories = ["Dinner", "Lunch", "Breakfast", "Sides", "Baking", "Dessert"] as const;
export const statuses = ["draft", "scheduled", "published"] as const;
export type Difficulty = typeof difficulties[number];
export type Category = typeof categories[number];
export type Status = typeof statuses[number];

export const kitchens = [
  { id: "owner", name: "Isaías", initials: "IP", bio: "Chooses Tuesday’s recipe and is usually looking for an excuse to spend a little more time in the kitchen." },
  { id: "daniel", name: "Daniel", initials: "D", bio: "A newer cook, learning a recipe at a time from his own perspective and within his timeframe." },
  { id: "jacky", name: "Jacky", initials: "J", bio: "A newer cook too. Will probably be cooking from her car" },
] as const;

export type KitchenId = typeof kitchens[number]["id"];

export type Photo = { path: string; alt: string; caption: string };
export type Ingredient = { amount: number | null; unit: string; name: string; note: string };
export type Step = { title: string; body: string; photo: Photo | null };
export type Submission = { kitchen: KitchenId; comment: string; cookedOn: string | null; photos: Photo[] };
export type Recipe = {
  id: string;
  issue: number;
  slug: string;
  title: string;
  intro: string;
  category: Category;
  difficulty: Difficulty;
  prep: number;
  cook: number;
  servings: number;
  notes: string;
  substitutions: string;
  status: Status;
  publishedAt: string | null;
  version: number;
  cover: Photo | null;
  ingredients: Ingredient[];
  steps: Step[];
  submissions: Submission[];
};
export type RecipeSummary = Omit<Recipe, "ingredients" | "steps" | "notes" | "substitutions" | "submissions"> & {
  completed: number;
};

export function issueNumber(issue: number) {
  return String(issue).padStart(3, "0");
}

export function publicationDate(value: string | null, options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" }) {
  return value ? new Intl.DateTimeFormat("en-US", { ...options, timeZone: zone }).format(new Date(value)) : "";
}

export function pacificDay(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const find = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${find("year")}-${find("month")}-${find("day")}`;
}

export function calendarDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function effectiveStatus(recipe: Pick<Recipe, "status" | "publishedAt">): Status {
  if (recipe.status === "scheduled" && recipe.publishedAt && Date.parse(recipe.publishedAt) <= Date.now()) return "published";
  return recipe.status;
}

export function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
