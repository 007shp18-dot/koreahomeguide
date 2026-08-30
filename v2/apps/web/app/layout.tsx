import type { Metadata } from "next";
import type { ReactNode } from "react";
import { preload } from "react-dom";
import { homepageCopy } from "../lib/site-copy";
import "./globals.css";

export const metadata: Metadata = homepageCopy.metadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  preload("/fonts/archivo-latin-wght-normal.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
