import Image from "next/image";
import type { Photo } from "@/lib/model";

const widths = [320, 480, 640, 960, 1280, 1600, 1920] as const;

export function photoURL(path: string, admin = false) {
  return path.startsWith("/images/") ? path : `${admin ? "/admin" : ""}/media/${path}`;
}

export function FoodPhoto({ photo, sizes, priority = false, className = "" }: { photo: Photo; sizes: string; priority?: boolean; className?: string }) {
  if (photo.path.startsWith("/images/")) {
    return <Image fill preload={priority} className={`food-photo ${className}`} src={photo.path} alt={photo.alt} sizes={sizes} />;
  }
  const src = photoURL(photo.path);
  // The media route generates responsive variants and rechecks publication before every download.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`${src}?w=960`} srcSet={widths.map((width) => `${src}?w=${width} ${width}w`).join(", ")} sizes={sizes} alt={photo.alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`food-photo ${className}`} />;
}
