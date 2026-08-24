import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bank & Sovereign News Monitor",
  description: "Financial institution and sovereign credit news monitoring"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
