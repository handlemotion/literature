import type { Metadata } from "next";
import localFont from "next/font/local";
import { Literature } from "@handlemotion/literature/devtools";
// oxlint-disable-next-line import/no-unassigned-import -- Next.js global styles
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Literature",
  description:
    "Dev-only copywriting tool for React apps — edit visible UI text in the canvas and sync back to source.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <Literature />
      </body>
    </html>
  );
}
