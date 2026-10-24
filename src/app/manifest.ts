import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yoniweb2 · ניהול תקציב",
    short_name: "Yoniweb2",
    description: "ניהול תקציב משפחתי ועסקי במקום אחד",
    lang: "he",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafb",
    theme_color: "#fafafb",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
