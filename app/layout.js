import "./globals.css";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/instrument-sans";
import Providers from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import Toaster from "@/components/ui/Toaster";
import JsonLd from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { clientEnv } from "@/lib/env";
import { isIndexable, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

export const metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_APP_URL),
  title: {
    default: `${siteConfig.name} | Nairobi restaurant finder`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: { type: "website", siteName: siteConfig.name, locale: "en_KE" },
  twitter: { card: "summary_large_image" },
  // Only a real production domain is indexable. Everywhere else pages are noindex.
  ...(isIndexable() ? {} : { robots: { index: false, follow: false } }),
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg"
        >
          Skip to main content
        </a>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <Providers>
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer />
          <BottomNav />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}