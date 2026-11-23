"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { categories, difficulties, effectiveStatus, issueNumber, kitchens, pacificDay, publicationDate, slugify, type Ingredient, type Photo, type Recipe, type Step, type Submission } from "@/lib/model";
import { editorSchema, type EditorValues } from "@/lib/editor-schema";
import { deleteRecipe, saveRecipe } from "../actions";
import { PhotoEditor, reordered } from "./photo-editor";

const blankIngredient: Ingredient = { amount: null, unit: "", name: "", note: "" };
const blankStep: Step = { title: "", body: "", photo: null };

function initialValues(id: string, recipe?: Recipe): EditorValues {
  const submissions = kitchens.map((person): Submission => recipe?.submissions.find((entry) => entry.kitchen === person.id)
    ?? { kitchen: person.id, cookedOn: null, comment: "", photos: [] });
  const status = recipe ? effectiveStatus(recipe) : "draft";
  if (recipe) return { ...recipe, status, submissions, scheduleDate: status === "scheduled" && recipe.publishedAt ? pacificDay(recipe.publishedAt) : "" };
  return {
    id, version: 0, slug: "", title: "", intro: "", category: "Dinner", difficulty: "Easy",
    prep: 15, cook: 30, servings: 4, notes: "", substitutions: "", status, scheduleDate: "",
    cover: null, ingredients: [], steps: [], submissions,
  };
}

type RowType = "ingredients" | "steps";

export function RecipeEditor({ id, initial, newlySaved }: { id: string; initial?: Recipe; newlySaved?: boolean }) {
  const router = useRouter();
  const [values, setValues] = useState(() => initialValues(id, initial));
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState(newlySaved ? "Recipe saved." : "");
  const [saving, startSaving] = useTransition();
  const [uploads, setUploads] = useState(0);
  const [publishedAt, setPublishedAt] = useState(initial?.publishedAt ?? null);
  const [issue, setIssue] = useState(initial?.issue ?? 0);
  const [savedStatus, setSavedStatus] = useState(values.status);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, startDeleting] = useTransition();
  const [activeSection, setActiveSection] = useState("general");
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function patch(update: (previous: EditorValues) => EditorValues) {
    setDirty(true);
    setValues(update);
  }

  function field<K extends keyof EditorValues>(key: K, value: EditorValues[K]) {
    patch((before) => ({ ...before, [key]: value }));
  }

  function updateRow(type: "ingredients", index: number, change: Partial<Ingredient>): void;
  function updateRow(type: "steps", index: number, change: Partial<Step>): void;
  function updateRow(type: RowType, index: number, change: Partial<Ingredient> | Partial<Step>) {
    patch((before) => ({ ...before, [type]: before[type].map((row, position) => index === position ? { ...row, ...change } : row) }));
  }

  function moveRow(type: RowType, index: number, destination: number) {
    if (type === "ingredients") field(type, reordered(values.ingredients, index, destination));
    else field(type, reordered(values.steps, index, destination));
  }

  function removeRow(type: RowType, index: number) {
    if (type === "ingredients") field(type, values.ingredients.filter((_, position) => position !== index));
    else field(type, values.steps.filter((_, position) => position !== index));
  }

  function updateSubmission(index: number, update: (entry: Submission) => Submission) {
    patch((before) => ({ ...before, submissions: before.submissions.map((entry, position) => index === position ? update(entry) : entry) }));
  }

  function showErrors(messages: string[]) {
    setErrors(messages);
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploads || saving) return;
    setErrors([]);
    setNotice("");
    const validation = editorSchema.safeParse(values);
    if (!validation.success) {
      showErrors([...new Set(validation.error.issues.map((error) => error.message))]);
      return;
    }
    startSaving(async () => {
      try {
        const result = await saveRecipe(validation.data);
        if (!result.saved) return showErrors(result.errors);
        setDirty(false);
        setIssue(result.issue);
        setPublishedAt(result.publishedAt);
        setSavedStatus(validation.data.status);
        setValues({ ...validation.data, version: result.version });
        setSlugEdited(true);
        setNotice(result.warning ?? (values.status === "draft" ? "Draft saved." : values.status === "scheduled" ? "Recipe scheduled." : "Published recipe saved."));
        if (!values.version) router.replace(`/admin/recipes/${id}?saved=1`);
      } catch {
        showErrors(["The save couldn’t be confirmed. Check your connection and the dashboard before retrying."]);
      }
    });
  }

  const photoProps = {
    recipeId: id,
    disabled: Boolean(uploads) || saving,
    onBusy: (busy: boolean) => setUploads((count) => count + (busy ? 1 : -1)),
  };
  const rowButtons = (type: RowType, index: number) => <div className="photo-buttons">
    <button type="button" className="icon-button" disabled={!!uploads || index === 0} aria-label={`Move row ${index + 1} up`} onClick={() => moveRow(type, index, index - 1)}><ArrowUp size={16} aria-hidden="true" /></button>
    <button type="button" className="icon-button" disabled={!!uploads || index >= values[type].length - 1} aria-label={`Move row ${index + 1} down`} onClick={() => moveRow(type, index, index + 1)}><ArrowDown size={16} aria-hidden="true" /></button>
    <button type="button" className="icon-button" disabled={!!uploads} aria-label={`Remove row ${index + 1}`} onClick={() => removeRow(type, index)}><Trash2 size={16} aria-hidden="true" /></button>
  </div>;

  const sections = [["general", "Recipe details"], ["ingredients", "Ingredients"], ["method", "Method"], ["journal", "Kitchen journal"]];
  const isPublished = savedStatus === "published";
  const savedPublicLink = isPublished && !dirty;
  const currentTitle = issue && values.title ? values.title : "New recipe";

  return <>
    <Link className="text-link" href="/admin"><ArrowLeft size={17} aria-hidden="true" /> All recipes</Link>
    <header className="admin-title editor-title">
      <div><p className="eyebrow section-kicker"><span /> {issue ? `Week ${issueNumber(issue)}` : "New entry"}</p><h1>{currentTitle}<span className="red">.</span></h1></div>
      {savedPublicLink && <Link className="button button-outline" href={`/recipes/${values.slug}`}>View public recipe</Link>}
    </header>
    <form className="admin-editor" noValidate onSubmit={save}>
      <nav className="editor-nav" aria-label="Editor sections">
        {sections.map(([section, title]) => <button type="button" aria-current={section === activeSection ? "location" : undefined} key={section} onClick={() => setActiveSection(section)}>{title}</button>)}
      </nav>
      <fieldset disabled={saving || deleting} className="editor-fields">
        <section className="editor-panel" hidden={activeSection !== "general"}>
          <h2>Recipe details</h2>
          <div className="form-grid">
            <label>Recipe title<input value={values.title} maxLength={140} required onChange={(event) => {
              const title = event.target.value;
              patch((before) => ({ ...before, title, slug: slugEdited ? before.slug : slugify(title).slice(0, 100).replace(/-$/, "") }));
            }} /></label>
            <label>Recipe link<input value={values.slug} readOnly={isPublished} maxLength={100} required onChange={(event) => { setSlugEdited(true); field("slug", event.target.value); }} /></label>
            <label className="full-width">Introduction<textarea value={values.intro} rows={4} maxLength={2500} onChange={(event) => field("intro", event.target.value)} /></label>
            <label>Category<select value={values.category} onChange={(event) => field("category", event.target.value as EditorValues["category"])}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Difficulty<select value={values.difficulty} onChange={(event) => field("difficulty", event.target.value as EditorValues["difficulty"])}>{difficulties.map((item) => <option key={item}>{item}</option>)}</select></label>
            <div className="full-width form-grid numbers-grid">
              <label>Prep time (min)<input type="number" min={0} max={10080} value={values.prep} onChange={(event) => field("prep", Number(event.target.value))} /></label>
              <label>Cook time (min)<input type="number" min={0} max={10080} value={values.cook} onChange={(event) => field("cook", Number(event.target.value))} /></label>
              <label>Servings<input type="number" min={1} max={48} value={values.servings} onChange={(event) => field("servings", Number(event.target.value))} /></label>
            </div>
          </div>
          <PhotoEditor {...photoProps} label="Cover photograph" photos={values.cover ? [values.cover] : []} limit={1} onChange={(update) => patch((before) => ({ ...before, cover: update(before.cover ? [before.cover] : [])[0] ?? null }))} />
        </section>
        <section className="editor-panel" hidden={activeSection !== "ingredients"}>
          <h2>Ingredients</h2><p>Enter decimal amounts for serving adjustments. Leave the amount blank for entries such as salt to taste.</p>
          {values.ingredients.map((ingredient, index) => <div className="editor-row" key={index}>
            <div className="editor-row-title"><h3>Ingredient {index + 1}</h3>{rowButtons("ingredients", index)}</div>
            <div className="form-grid ingredient-fields">
              <label>Amount<input type="number" step="any" min={0} value={ingredient.amount ?? ""} onChange={(event) => updateRow("ingredients", index, { amount: event.target.value === "" ? null : Number(event.target.value) })} /></label>
              <label>Unit<input value={ingredient.unit} maxLength={40} placeholder="e.g. tbsp" onChange={(event) => updateRow("ingredients", index, { unit: event.target.value })} /></label>
              <label>Ingredient<input value={ingredient.name} maxLength={160} onChange={(event) => updateRow("ingredients", index, { name: event.target.value })} /></label>
              <label>Notes<input value={ingredient.note} maxLength={200} placeholder="Optional" onChange={(event) => updateRow("ingredients", index, { note: event.target.value })} /></label>
            </div>
          </div>)}
          <button type="button" className="button button-outline add-button" disabled={values.ingredients.length >= 100} onClick={() => field("ingredients", [...values.ingredients, blankIngredient])}><Plus size={18} aria-hidden="true" /> Add ingredient</button>
        </section>
        <section className="editor-panel" hidden={activeSection !== "method"}>
          <h2>Method</h2><p>Give each step its own action. Short steps are easier to follow at the stove.</p>
          {values.steps.map((step, index) => <div className="editor-row" key={index}>
            <div className="editor-row-title"><h3>Step {index + 1}</h3>{rowButtons("steps", index)}</div>
            <label>Step title<input value={step.title} maxLength={140} onChange={(event) => updateRow("steps", index, { title: event.target.value })} /></label>
            <label>Instructions<textarea value={step.body} rows={3} maxLength={4000} onChange={(event) => updateRow("steps", index, { body: event.target.value })} /></label>
            <PhotoEditor {...photoProps} label="Step photo (optional)" photos={step.photo ? [step.photo] : []} limit={1} onChange={(update) => patch((before) => ({
              ...before, steps: before.steps.map((row, position) => index === position ? { ...row, photo: update(row.photo ? [row.photo] : [])[0] ?? null } : row),
            }))} />
          </div>)}
          <button type="button" className="button button-outline add-button" disabled={values.steps.length >= 60} onClick={() => field("steps", [...values.steps, blankStep])}><Plus size={18} aria-hidden="true" /> Add step</button>
          <div className="form-grid method-notes">
            <label>Kitchen notes<textarea value={values.notes} maxLength={4000} rows={4} onChange={(event) => field("notes", event.target.value)} /></label>
            <label>Substitutions<textarea value={values.substitutions} maxLength={4000} rows={4} onChange={(event) => field("substitutions", event.target.value)} /></label>
          </div>
        </section>
        <section className="editor-panel" hidden={activeSection !== "journal"}>
          <h2>Kitchen journal</h2><p>Add each friend’s photographs and notes as they come in.</p>
          {values.submissions.map((entry, index) => <div className="editor-row" key={entry.kitchen}>
            <h3>{kitchens[index].name}’s kitchen</h3>
            <div className="form-grid">
              <label>Cook date<input type="date" value={entry.cookedOn ?? ""} onChange={(event) => updateSubmission(index, (current) => ({ ...current, cookedOn: event.target.value || null }))} /></label>
              <label className="full-width">Comment<textarea value={entry.comment} maxLength={4000} rows={3} onChange={(event) => updateSubmission(index, (current) => ({ ...current, comment: event.target.value }))} /></label>
            </div>
            <PhotoEditor {...photoProps} label="Finished dish photos" photos={entry.photos} limit={16} onChange={(update: (photos: Photo[]) => Photo[]) => updateSubmission(index, (current) => ({ ...current, photos: update(current.photos) }))} />
          </div>)}
        </section>
        <section className="editor-panel publish-panel" aria-labelledby="publish-heading">
          <h2 id="publish-heading">Publication</h2>
          <div className="form-grid">
            <label>Status<select value={values.status} onChange={(event) => field("status", event.target.value as EditorValues["status"])}>
              <option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Schedule for Tuesday</option>
            </select></label>
            {values.status === "scheduled" && <label>Tuesday date (Pacific time)<input type="date" value={values.scheduleDate} onChange={(event) => field("scheduleDate", event.target.value)} /></label>}
          </div>
          {publishedAt && <p>{savedStatus === "scheduled" ? "Scheduled for" : "Published"} {publicationDate(publishedAt)}.</p>}
          {values.status === "draft" && publishedAt && <p>Saving as a draft removes this recipe and its photos from public view.</p>}
          {values.status === "scheduled" && <p>Scheduled recipes go public at midnight in Los Angeles.</p>}
          <div ref={statusRef} tabIndex={-1} className="editor-result">
            {!!errors.length && <ul className="form-error" role="alert">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
            {notice && <p className="admin-notice" role="status">{notice}</p>}
          </div>
          <div className="admin-actions">
            <button type="submit" className="button button-red" disabled={!!uploads || saving}>{saving ? "Saving…" : uploads ? "Uploading photos…" : values.status === "draft" ? "Save draft" : values.status === "scheduled" ? "Save schedule" : isPublished ? "Save changes" : "Publish recipe"}</button>
            {!!values.version && <button type="button" className="text-link delete-link" disabled={!!uploads} onClick={() => { setDeleteError(""); setConfirmDelete(true); }}>Delete recipe</button>}
          </div>
        </section>
      </fieldset>
    </form>
    {confirmDelete && <Dialog label="Delete recipe" onClose={() => { if (!deleting) setConfirmDelete(false); }}>
      <div className="delete-dialog"><h2>Delete this recipe?</h2><p>This permanently removes the recipe and all its kitchen entries.</p>
        {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
        <div className="admin-actions">
          <button type="button" className="button button-outline" disabled={deleting} onClick={() => setConfirmDelete(false)}>Keep recipe</button>
          <button type="button" className="button button-red" disabled={deleting} onClick={() => startDeleting(async () => {
            const message = await deleteRecipe(id, values.version);
            setDeleteError(message);
          })}>{deleting ? "Deleting…" : "Delete recipe"}</button>
        </div>
      </div>
    </Dialog>}
  </>;
}
