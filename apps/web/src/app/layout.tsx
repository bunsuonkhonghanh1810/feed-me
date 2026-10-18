import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { MeshProviderWrapper } from "@/components/MeshProviderWrapper";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Feed Me | Cardano Decentralized Micro-Grant & Staking Pool",
  description: "Canteen & Community Kitchen dApp on Cardano powered by Liquid Staking & Quadratic Voting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={plusJakartaSans.variable}>
      <body className="antialiased bg-soft-cream text-deep-navy">
        <MeshProviderWrapper>{children}</MeshProviderWrapper>
      </body>
    </html>
  );
}
