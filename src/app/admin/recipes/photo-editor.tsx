"use client";

import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2, Upload } from "lucide-react";
import { photoURL } from "@/components/photo";
import type { Photo } from "@/lib/model";
import { photoAccept } from "@/lib/upload-rules";

const maxSourceBytes = 30_000_000;
const maxUploadBytes = 3_900_000;

async function prepare(file: File): Promise<File | Blob> {
  if (!file.size || file.size > maxSourceBytes) throw new Error("Choose a photograph under 30 MB.");
  if (!/\.(jpe?g|png|webp|avif)$/i.test(file.name) && !/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
    throw new Error("Use a JPG, PNG, WebP, or AVIF photograph.");
  }
  if (file.size <= maxUploadBytes) return file;
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error("This photograph could not be opened."); });
  const canvas = document.createElement("canvas");
  try {
    const ratio = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not resize the photograph.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const compressed = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
    if (!compressed || compressed.size > maxUploadBytes) throw new Error("The resized photograph is too large.");
    return compressed;
  } finally {
    bitmap.close();
  }
}

async function sendPhoto(file: File, recipeId: string): Promise<Photo> {
  const data = new FormData();
  data.append("recipeId", recipeId);
  data.append("photo", await prepare(file), file.name);
  const response = await fetch("/admin/uploads", { method: "POST", body: data });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new Error(result?.error ?? "The upload didn’t finish. Try again.");
  return result;
}

export function reordered<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

type Props = {
  label: string;
  recipeId: string;
  photos: Photo[];
  limit: number;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
  onChange: (update: (photos: Photo[]) => Photo[]) => void;
};

export function PhotoEditor({ label, recipeId, photos, limit, disabled, onBusy, onChange }: Props) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const replaceIndex = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(files: File[], replace: number | null = null) {
    if (!files.length || disabled || uploading) return;
    const available = replace !== null ? 1 : limit - photos.length;
    if (available < 1) return;
    setDragging(false);
    setUploading(true);
    onBusy(true);
    setMessage("");
    const uploaded: Photo[] = [];
    try {
      for (const file of files.slice(0, available)) uploaded.push(await sendPhoto(file, recipeId));
      if (files.length > available) setMessage(`This section holds up to ${limit} photos.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The photograph couldn’t be uploaded.");
    } finally {
      if (uploaded.length) onChange((previous) => replace === null ? [...previous, ...uploaded] : previous.map((photo, index) => index === replace ? { ...photo, path: uploaded[0].path } : photo));
      setUploading(false);
      onBusy(false);
    }
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    setDragging(false);
    void upload(Array.from(event.dataTransfer.files), limit === 1 && photos.length ? 0 : null);
  }

  function selected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void upload(files, replaceIndex.current);
    replaceIndex.current = null;
  }

  function choosePhoto(replace: number | null = null) {
    replaceIndex.current = replace;
    if (input.current) {
      input.current.multiple = replace === null && limit > 1;
      input.current.click();
    }
  }

  function changePhoto(index: number, field: "alt" | "caption", value: string) {
    onChange((previous) => previous.map((photo, position) => index === position ? { ...photo, [field]: value } : photo));
  }

  return <div className="photo-editor">
    <p className="photo-label">{label}</p>
    <input ref={input} id={inputId} type="file" accept={photoAccept} hidden disabled={disabled} onChange={selected} />
    <div className={`photo-drop ${dragging ? "is-dragging" : ""}`} aria-busy={uploading} onDragOver={(event) => {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      if (!disabled) setDragging(true);
    }} onDragLeave={() => setDragging(false)} onDrop={drop}>
      <ImagePlus size={21} aria-hidden="true" />
      <div>
        <button type="button" disabled={disabled || (photos.length >= limit && limit > 1)} className="text-link" onClick={() => choosePhoto(photos.length && limit === 1 ? 0 : null)}>{uploading ? "Uploading…" : photos.length && limit === 1 ? "Replace photograph" : "Choose photos"}</button>
        {!uploading && <p>Drop JPG, PNG, WebP, or AVIF files here.</p>}
      </div>
    </div>
    {message && <p className="form-error" role="alert">{message}</p>}
    {!!photos.length && <ul className="admin-photos">{photos.map((photo, index) => <li key={photo.path}>
      {/* Admin previews are intentionally served with session validation and no caching. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photoURL(photo.path, true)} alt={photo.alt || "Newly uploaded photograph"} loading="lazy" width={135} height={106} />
      <div className="admin-photo-fields">
        <label>Image description <input value={photo.alt} maxLength={240} placeholder="Describe what is visible" onChange={(event) => changePhoto(index, "alt", event.target.value)} /></label>
        <label>Caption <input value={photo.caption} maxLength={300} placeholder="Optional" onChange={(event) => changePhoto(index, "caption", event.target.value)} /></label>
      </div>
      <div className="photo-buttons">
        {limit > 1 && <>
          <button type="button" className="icon-button" disabled={disabled || index === 0} title="Move photo up" aria-label={`Move photo ${index + 1} up`} onClick={() => onChange((previous) => reordered(previous, index, index - 1))}><ArrowUp size={16} aria-hidden="true" /></button>
          <button type="button" className="icon-button" disabled={disabled || index === photos.length - 1} title="Move photo down" aria-label={`Move photo ${index + 1} down`} onClick={() => onChange((previous) => reordered(previous, index, index + 1))}><ArrowDown size={16} aria-hidden="true" /></button>
          <button type="button" className="icon-button" disabled={disabled} title="Replace photo" aria-label={`Replace photo ${index + 1}`} onClick={() => choosePhoto(index)}><Upload size={16} aria-hidden="true" /></button>
        </>}
        <button type="button" className="icon-button" disabled={disabled} title="Remove photo" aria-label={`Remove photo ${index + 1}`} onClick={() => onChange((previous) => previous.filter((_, position) => position !== index))}><Trash2 size={16} aria-hidden="true" /></button>
      </div>
    </li>)}</ul>}
  </div>;
}
