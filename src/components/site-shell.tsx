"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronUp, KeyRound, Utensils } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/archive", label: "Recipe Archive" },
  { href: "/about", label: "About" },
];

export function Wordmark() {
  return <Link href="/" className="wordmark" aria-label="The Tuesday Table home">
    <span className="wordmark-icon"><Utensils size={17} strokeWidth={1.7} aria-hidden="true" /></span>
    <span>The Tuesday Table<span className="brand-period">.</span></span>
  </Link>;
}

export function Header() {
  const pathname = usePathname();
  return <header className="site-header page-wrap">
    <Wordmark />
    <nav aria-label="Main navigation">
      {links.map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}
    </nav>
    <Link className="header-admin" href="/admin" aria-label="Administrator login" title="Administrator login"><KeyRound size={17} aria-hidden="true" /></Link>
  </header>;
}

export function Footer() {
  return <footer className="site-footer">
    <div className="page-wrap footer-inner">
      <div><Wordmark /><p>One recipe. Three kitchens. Every week.</p></div>
      <div className="footer-links"><Link href="/admin">Admin</Link><a href="#top">Back to top <ChevronUp size={16} aria-hidden="true" /></a></div>
    </div>
  </footer>;
}
