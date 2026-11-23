"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Expand, Utensils } from "lucide-react";
import { calendarDate, kitchens, type Photo, type Submission } from "@/lib/model";
import { Dialog } from "./dialog";
import { FoodPhoto } from "./photo";
import { Reveal } from "./reveal";

export function KitchenJournal({ submissions }: { submissions: Submission[] }) {
  const [gallery, setGallery] = useState<{ photos: Photo[]; index: number; label: string } | null>(null);

  function move(direction: number) {
    setGallery((open) => open && { ...open, index: (open.index + direction + open.photos.length) % open.photos.length });
  }

  const selected = gallery?.photos[gallery.index];
  return <section className="journal-section" aria-labelledby="journal-heading">
    <div className="page-wrap">
      <div className="journal-heading section-heading">
        <div><p className="eyebrow section-kicker"><span /> The cooking journal</p><h2 id="journal-heading">Three kitchens,<br /><em>one recipe.</em></h2></div>
        <p>What came out of our ovens, what we changed, and what we’d do differently next time.</p>
      </div>
      <div className="kitchen-entries">
        {kitchens.map((kitchen, kitchenIndex) => {
          const entry = submissions.find((submission) => submission.kitchen === kitchen.id);
          const hasEntry = entry && (entry.photos.length > 0 || entry.comment || entry.cookedOn);
          const label = `${kitchen.name}’s kitchen`;
          return <Reveal className={`kitchen-entry ${entry?.photos.length ? "has-photos" : ""}`} key={kitchen.id} delay={kitchenIndex * 0.04}>
            <div className="kitchen-story">
              <div className="kitchen-mark"><Utensils size={18} aria-hidden="true" /></div>
              <div><h3>{label}</h3>
                {!hasEntry && <p>{label} is still warming up.</p>}
                {entry?.cookedOn && <time dateTime={entry.cookedOn}>{calendarDate(entry.cookedOn)}</time>}
                {entry?.comment && <blockquote>{entry.comment}</blockquote>}
              </div>
            </div>
            {!!entry?.photos.length && <div className="journal-photos">
              {entry.photos.map((photo, index) => <figure key={`${photo.path}-${index}`}>
                <button className="journal-photo-button" type="button" aria-label={`Open photo ${index + 1} from ${label}`} onClick={() => setGallery({ photos: entry.photos, index, label })}>
                  <FoodPhoto photo={photo} sizes="(max-width: 780px) 85vw, 500px" /><span className="expand-photo"><Expand size={17} aria-hidden="true" /></span>
                </button>
                {photo.caption && <figcaption>{photo.caption}</figcaption>}
              </figure>)}
            </div>}
          </Reveal>;
        })}
      </div>
    </div>
    {gallery && selected && <Dialog label={gallery.label + " photo gallery"} onClose={() => setGallery(null)} className="gallery-dialog" onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}>
      <div className="gallery-content">
        <p className="eyebrow"><Camera size={16} aria-hidden="true" /> {gallery.label}</p>
        <figure aria-live="polite"><div className="gallery-image"><FoodPhoto photo={selected} sizes="90vw" className="object-contain" /></div><figcaption>{selected.caption || selected.alt}</figcaption></figure>
        {gallery.photos.length > 1 && <div className="gallery-navigation">
          <button type="button" className="icon-button" onClick={() => move(-1)} aria-label="Previous photo"><ArrowLeft size={20} aria-hidden="true" /></button>
          <span aria-live="polite">{gallery.index + 1} / {gallery.photos.length}</span>
          <button type="button" className="icon-button" onClick={() => move(1)} aria-label="Next photo"><ArrowRight size={20} aria-hidden="true" /></button>
        </div>}
      </div>
    </Dialog>}
  </section>;
}
