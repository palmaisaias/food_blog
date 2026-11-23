"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChefHat, Minus, Plus, Printer, Share2 } from "lucide-react";
import type { Recipe } from "@/lib/model";
import { Dialog } from "./dialog";
import { FoodPhoto } from "./photo";

const fractions: [number, string][] = [[1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"], [3 / 8, "⅜"], [1 / 2, "½"], [5 / 8, "⅝"], [2 / 3, "⅔"], [3 / 4, "¾"], [7 / 8, "⅞"]];

function quantity(amount: number | null, ratio: number) {
  if (amount === null) return "";
  const value = amount * ratio;
  const whole = Math.floor(value);
  const fraction = fractions.find(([decimal]) => Math.abs(value - whole - decimal) < 0.005);
  if (fraction) return `${whole || ""}${fraction[1]}`;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function Ingredients({ recipe }: { recipe: Recipe }) {
  const [servings, setServings] = useState(recipe.servings);
  const [checked, setChecked] = useState<Set<number>>(() => new Set());

  function toggle(index: number) {
    setChecked((before) => {
      const next = new Set(before);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return <section className="ingredient-panel" aria-labelledby="ingredients-title">
    <div className="ingredient-heading">
      <h3 id="ingredients-title">Ingredients</h3>
      <div className="serving-control" aria-label="Adjust servings">
        <button type="button" onClick={() => setServings((value) => value - 1)} disabled={servings <= 1} aria-label="Decrease servings"><Minus size={16} aria-hidden="true" /></button>
        <output aria-live="polite">{servings} {servings === 1 ? "serving" : "servings"}</output>
        <button type="button" onClick={() => setServings((value) => value + 1)} disabled={servings >= 48} aria-label="Increase servings"><Plus size={16} aria-hidden="true" /></button>
      </div>
      <p className="print-only">Makes {servings} {servings === 1 ? "serving" : "servings"}</p>
    </div>
    <ul className="ingredient-list">
      {recipe.ingredients.map((ingredient, index) => <li key={index}>
        <label className="ingredient">
          <input type="checkbox" checked={checked.has(index)} onChange={() => toggle(index)} />
          <span className="check-mark"><Check size={14} strokeWidth={2.6} aria-hidden="true" /></span>
          <span className="ingredient-text"><strong>{[quantity(ingredient.amount, servings / recipe.servings), ingredient.unit].filter(Boolean).join(" ")}</strong> {ingredient.name}{ingredient.note && <small>, {ingredient.note}</small>}</span>
        </label>
      </li>)}
    </ul>
    {servings !== recipe.servings && <p className="serving-note">Quantities are adjusted. Use your judgment for pan size, seasoning, and timing.</p>}
    <div className="prep-line"><span>Prep <strong>{recipe.prep} min</strong></span><span>Cook <strong>{recipe.cook} min</strong></span></div>
  </section>;
}

function CookMode({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const step = recipe.steps[index];
  const last = index === recipe.steps.length - 1;
  return <Dialog label="Cook mode" className="cook-dialog" onClose={onClose}>
    <p className="eyebrow cook-recipe-title">{recipe.title}</p>
    <div className="cook-step" aria-live="polite" aria-atomic="true">
      <p className="eyebrow cook-progress">Step {index + 1} of {recipe.steps.length}</p>
      <progress max={recipe.steps.length} value={index + 1} aria-label="Recipe progress" />
      <h2>{step.title || `Step ${index + 1}`}</h2>
      <p>{step.body}</p>
      {step.photo && <div className="step-image cook-image"><FoodPhoto photo={step.photo} sizes="(max-width: 700px) 90vw, 620px" /></div>}
    </div>
    <div className="cook-navigation">
      <button type="button" className="button button-outline" onClick={() => setIndex(index - 1)} disabled={index === 0}><ArrowLeft size={17} aria-hidden="true" /> Previous</button>
      <button type="button" className="button button-red" onClick={last ? onClose : () => setIndex(index + 1)}>{last ? "Finish cooking" : "Next step"} {last ? <Check size={17} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}</button>
    </div>
    <button type="button" className="text-link cook-return" onClick={onClose}>Back to the full recipe</button>
  </Dialog>;
}

export function RecipeControls({ recipe }: { recipe: Recipe }) {
  const [cooking, setCooking] = useState(false);
  const [shareState, setShareState] = useState("");
  const [shareLink, setShareLink] = useState("");

  async function share() {
    const url = new URL(`/recipes/${recipe.slug}`, window.location.origin).href;
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareState("Recipe link copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareLink(url);
    }
  }

  return <section id="the-recipe" className="page-wrap recipe-section" aria-labelledby="recipe-heading">
    <header className="section-heading recipe-heading">
      <div><p className="eyebrow section-kicker"><span /> At the stove</p><h2 id="recipe-heading">The Recipe<span className="red">.</span></h2></div>
      <div className="recipe-toolbar">
        <button type="button" className="button button-outline" onClick={() => setCooking(true)}><ChefHat size={19} aria-hidden="true" /> Cook mode</button>
        <button type="button" className="icon-button" title="Print recipe" aria-label="Print recipe" onClick={() => window.print()}><Printer size={19} aria-hidden="true" /></button>
        <button type="button" className="icon-button" title="Share recipe" aria-label="Share recipe" onClick={share}><Share2 size={19} aria-hidden="true" /></button>
        <span className="share-status" role="status">{shareState}</span>
      </div>
    </header>
    <div className="print-only print-title"><h1>{recipe.title}</h1><p>{recipe.intro}</p></div>
    <div className="recipe-columns">
      <Ingredients recipe={recipe} />
      <section className="directions" aria-labelledby="directions-title">
        <h3 id="directions-title">Method</h3>
        <ol role="list">
          {recipe.steps.map((step, index) => <li className="method-step" key={index}>
            <span className="step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div>{step.title && <h4>{step.title}</h4>}<p>{step.body}</p>
              {step.photo && <figure><div className="step-image"><FoodPhoto photo={step.photo} sizes="(max-width: 780px) 88vw, 580px" /></div>{step.photo.caption && <figcaption>{step.photo.caption}</figcaption>}</figure>}
            </div>
          </li>)}
        </ol>
        {(recipe.notes || recipe.substitutions) && <aside className="recipe-notes">
          {recipe.notes && <div><h4>Kitchen notes</h4><p>{recipe.notes}</p></div>}
          {recipe.substitutions && <div><h4>Substitutions</h4><p>{recipe.substitutions}</p></div>}
        </aside>}
      </section>
    </div>
    {cooking && <CookMode recipe={recipe} onClose={() => setCooking(false)} />}
    {shareLink && <Dialog label="Share recipe" className="share-dialog" onClose={() => setShareLink("")}>
      <h2>Share the recipe</h2><label>Recipe link <input readOnly value={shareLink} onFocus={(event) => event.target.select()} /></label>
    </Dialog>}
  </section>;
}
