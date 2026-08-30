import type { Metadata } from "next";
import type { ReactNode } from "react";
import { homepageCopy } from "../lib/site-copy";
import "@fontsource-variable/archivo";
import "./globals.css";

export const metadata: Metadata = homepageCopy.metadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
