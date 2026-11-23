import type { Ingredient, Photo, Recipe, Step } from "./model";

const ingredient = (amount: Ingredient["amount"], unit: string, name: string, note = ""): Ingredient => ({ amount, unit, name, note });
const step = (title: string, body: string): Step => ({ title, body, photo: null });
const cover = (filename: string, alt: string): Photo => ({ path: `/images/${filename}.webp`, alt, caption: "Illustrative sample recipe photograph" });

export const demoRecipes: Recipe[] = [
  {
    id: "demo-lemon-chicken", issue: 7, slug: "crispy-lemon-chicken-and-potatoes",
    title: "Crispy Lemon Chicken & Potatoes",
    intro: "A one-pan dinner with shatteringly crisp skin, soft-centered potatoes, and lemons that go sweet in the oven. The whole kitchen will smell like rosemary.",
    category: "Dinner", difficulty: "Easy", prep: 15, cook: 45, servings: 4, status: "published",
    publishedAt: "2026-11-17T08:00:00Z", version: 1,
    cover: cover("lemon-chicken", "Crispy roast chicken thighs, golden potatoes and charred lemons in a dark roasting pan"),
    ingredients: [
      ingredient(4, "", "bone-in, skin-on chicken thighs"),
      ingredient(1.5, "lb", "baby Yukon Gold potatoes", "halved"),
      ingredient(2, "", "lemons", "one thinly sliced, one halved"),
      ingredient(3, "tbsp", "extra-virgin olive oil", "divided"),
      ingredient(4, "cloves", "garlic", "lightly smashed"),
      ingredient(3, "sprigs", "fresh rosemary"),
      ingredient(1.5, "tsp", "kosher salt", "divided"),
      ingredient(null, "", "freshly ground black pepper", "to taste"),
    ],
    steps: [
      step("Heat the oven and prep the pan", "Set a rack in the middle of the oven and heat to 425°F (220°C). Cut the potatoes in half. If any are much bigger than the others, quarter them so they finish at the same time."),
      step("Season the potatoes", "Toss the potatoes, sliced lemon, garlic, and rosemary with 2 tablespoons of olive oil, ½ teaspoon of salt, and a few grinds of pepper. Spread them cut-side down in a large roasting pan. Tuck the lemon halves in cut-side down."),
      step("Give the chicken a head start on crisping", "Pat the chicken dry with paper towels. Rub it with the remaining olive oil, 1 teaspoon of salt, and pepper. Nestle the thighs skin-side up among the potatoes, leaving a little room around each one."),
      step("Roast until golden", "Roast for 40–45 minutes, until the potatoes are tender and a thermometer inserted into the thickest part of each thigh, without touching bone, reads at least 165°F (74°C). If the potatoes need more time, move the chicken to a plate and return the pan to the oven."),
      step("Rest, then squeeze over the lemon", "Rest the chicken for 5 minutes. Use tongs to squeeze a roasted lemon half over the pan. Taste a potato and add another pinch of salt or a little more lemon if you like."),
    ],
    notes: "Give everything some breathing room. If the pieces are crowded, divide them between two pans and check both for doneness.",
    substitutions: "Small red potatoes work in place of Yukon Golds. Try thyme in place of rosemary, or leave the herbs out and finish with chopped parsley.",
    submissions: [],
  },
  {
    id: "demo-butter-beans", issue: 6, slug: "lemony-butter-beans",
    title: "Lemony Butter Beans",
    intro: "Creamy butter beans, a handful of greens, and plenty of bread for whatever’s left in the bowl.",
    category: "Dinner", difficulty: "Easy", prep: 10, cook: 25, servings: 4, status: "published", publishedAt: "2026-11-10T08:00:00Z", version: 1,
    cover: cover("butter-beans", "Creamy butter beans with kale and lemon zest in a ceramic bowl"),
    ingredients: [ingredient(2, "tbsp", "olive oil"), ingredient(3, "cloves", "garlic", "thinly sliced"), ingredient(2, "cans", "butter beans", "15 oz each, drained and rinsed"), ingredient(1, "cup", "vegetable stock"), ingredient(3, "cups", "chopped kale", "stems removed"), ingredient(1, "", "lemon"), ingredient(null, "", "salt and crusty bread", "for serving")],
    steps: [
      step("Soften the garlic", "Warm the olive oil in a wide pan over medium-low heat. Add the garlic and stir for about a minute, until it smells fragrant and is still pale."),
      step("Simmer the beans", "Add the beans and stock. Bring to a gentle simmer and cook for 15 minutes. Mash a few beans against the side of the pan with a spoon to thicken the broth."),
      step("Wilt the greens", "Stir in the kale and simmer for 4–6 minutes, until tender. Zest and juice the lemon into the pan a little at a time, tasting as you go. Add salt to taste and serve with bread."),
    ],
    notes: "If the broth thickens more than you’d like, add a splash of water before serving.",
    substitutions: "Cannellini beans or chickpeas work here. Baby spinach needs only a minute or two in the pan.",
    submissions: [],
  },
  {
    id: "demo-tomato-toasts", issue: 5, slug: "roasted-tomato-and-ricotta-toasts",
    title: "Roasted Tomato & Ricotta Toasts",
    intro: "Slow-roasted tomatoes, cool ricotta, and good toast. An especially good use for tomatoes on their last legs.",
    category: "Lunch", difficulty: "Easy", prep: 10, cook: 30, servings: 4, status: "published", publishedAt: "2026-11-03T08:00:00Z", version: 1,
    cover: cover("tomato-toasts", "Thick ricotta toast with roasted tomatoes and fresh basil"),
    ingredients: [ingredient(1, "lb", "cherry tomatoes"), ingredient(2, "tbsp", "extra-virgin olive oil"), ingredient(4, "slices", "sourdough"), ingredient(1, "cup", "whole-milk ricotta"), ingredient(0.25, "cup", "basil leaves"), ingredient(null, "", "salt and black pepper", "to taste")],
    steps: [
      step("Roast the tomatoes", "Heat the oven to 400°F (205°C). Toss the tomatoes in a small baking dish with olive oil and a pinch of salt. Roast for 25–30 minutes, until they collapse and release their juices."),
      step("Toast the bread", "Toast the slices until they’re crisp enough to support the tomatoes. Stir the ricotta with a small pinch of salt and a few grinds of black pepper."),
      step("Build the toasts", "Spread ricotta on the bread. Spoon the tomatoes and their juices over it, tear the basil leaves on top, and eat right away."),
    ],
    notes: "Roast the tomatoes in advance and assemble the toasts just before eating.",
    substitutions: "Try soft goat cheese or a thick spoonful of strained plain yogurt instead of ricotta.",
    submissions: [],
  },
];
