import type { Metadata } from "next";
import Link from "next/link";
import { FoodPhoto } from "@/components/photo";
import { Reveal } from "@/components/reveal";
import { kitchens } from "@/lib/model";

export const metadata: Metadata = {
  title: "About", description: "Meet the three friends behind The Tuesday Table, a shared weekly cooking journal.",
};

export default function About() {
  return <>
    <section className="page-wrap about-layout">
      <div className="editorial-heading">
        <p className="eyebrow section-kicker"><span /> About the table</p>
        <h1>Three friends.<br /><em>One Tuesday.</em></h1>
        <p style={{
          fontSize: '0.85rem',
          fontStyle: 'italic',
          textAlign: 'center',
          color: '#000',
          marginTop: '8px'
        }}>
          dramatic... I know.
        </p>
        <p>Isaías picks a recipe on Tuesday...hopefully. Then he, Daniel, and Jacky each make it in their own kitchen sometime that week.</p>
        <p>After dinner, we compare notes and put the photos here. We might make the same recipe three different ways. That’s usually the part worth writing down.</p>
      </div>
      <figure><div className="about-image"><FoodPhoto photo={{ path: "/images/table-still-life.webp", alt: "A cutting board with lemons and rosemary on a red-striped kitchen tablecloth", caption: "" }} priority sizes="(max-width: 780px) 92vw, 560px" /></div></figure>
    </section>
    <section className="about-kitchens" aria-labelledby="meet-heading">
      <div className="page-wrap">
        <p className="eyebrow section-kicker"><span /> Around the table</p><h2 id="meet-heading">Meet the <em>cooks.</em></h2>
        {kitchens.map((kitchen) => <Reveal key={kitchen.id} className="bio">
          <span className="bio-initial" aria-hidden="true">{kitchen.initials}</span><h3>{kitchen.name}</h3><p>{kitchen.bio}</p>
        </Reveal>)}
        <Link className="button button-outline" href="/">See what’s cooking</Link>
      </div>
    </section>
  </>;
}
