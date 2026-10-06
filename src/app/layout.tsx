import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorker } from "@/components/service-worker";

export const metadata: Metadata = {
  title: "Footwear Inventory",
  description: "Footwear shop inventory and POS",
  applicationName: "Footwear Inventory",
  manifest: "/manifest.webmanifest"
};

import { Inter, Geist } from 'next/font/google';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        <ServiceWorker />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
