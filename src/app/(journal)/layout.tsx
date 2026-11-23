import { Footer, Header } from "@/components/site-shell";

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return <><div id="top" /><Header /><main id="main-content">{children}</main><Footer /></>;
}
