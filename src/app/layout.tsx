import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { Toaster } from "sonner";
import { StoreHydrator } from "@/lib/store/app-store";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "Yoniweb2 · ניהול תקציב",
  description: "ניהול תקציב משפחתי ועסקי במקום אחד",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafb" },
    { media: "(prefers-color-scheme: dark)", color: "#141518" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <StoreHydrator />
        {children}
        <Toaster
          dir="rtl"
          theme="system"
          position="bottom-center"
          mobileOffset={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
          toastOptions={{ className: "font-sans" }}
        />
      </body>
    </html>
  );
}
