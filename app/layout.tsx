import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Givora World",
  description: "Limited-edition digital particle art.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "dark", geistSans.variable, geistMono.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <Suspense fallback={<div className="h-10 border-b border-[var(--line)]" />}><Breadcrumbs /></Suspense>
        <div className="flex-1 flex flex-col page-enter">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
