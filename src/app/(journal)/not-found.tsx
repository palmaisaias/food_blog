import Link from "next/link";

export default function NotFound() {
  return <section className="page-wrap empty-home">
    <h1>Recipe <em>unavailable.</em></h1>
    <p>Check the link or browse the published recipes in the archive.</p>
    <Link className="button button-red" href="/archive">See the recipe archive</Link>
  </section>;
}
