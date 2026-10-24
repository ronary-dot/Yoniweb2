import type { Metadata } from "next";
import { WelcomeView } from "@/components/welcome/welcome-view";

export const metadata: Metadata = {
  title: "ברוכים הבאים · Yoniweb2",
};

export default function WelcomePage() {
  return <WelcomeView />;
}
