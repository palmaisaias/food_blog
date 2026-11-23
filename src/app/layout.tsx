import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/fraunces/soft.css";
import "@fontsource-variable/fraunces/soft-italic.css";
import "./globals.css";
import { siteOrigin } from "@/lib/config";

const description = "One recipe. Three kitchens. Every week. A cooking journal between three friends.";

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title: { default: "The Tuesday Table", template: "%s | The Tuesday Table" },
  description,
  openGraph: { title: "The Tuesday Table", description, siteName: "The Tuesday Table", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a>{children}</body></html>;
}
