import type { Metadata } from "next";
import { Wordmark } from "@/components/site-shell";
import "./admin.css";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>
    <header className="admin-header page-wrap"><Wordmark /><span>Owner’s desk</span></header>
    <main className="admin-main page-wrap" id="main-content">{children}</main>
  </>;
}
