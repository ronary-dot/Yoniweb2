import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { Providers } from "@/components/providers";
import { StoreHydrator } from "@/lib/store/app-store";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "Yoniweb2 · ניהול תקציב",
  description: "ניהול תקציב משפחתי ועסקי במקום אחד",
  applicationName: "Yoniweb2",
  appleWebApp: { capable: true, title: "Yoniweb2", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafb" },
    { media: "(prefers-color-scheme: dark)", color: "#141518" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full font-sans">
        <StoreHydrator />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
