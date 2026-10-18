import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { MeshProviderWrapper } from "@/components/MeshProviderWrapper";
import { ClientLayout } from "@/components/ClientLayout";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Feed Me | Cardano Community Canteen & Micro-Grant Pool",
  description:
    "Canteen & Community Kitchen dApp on Cardano powered by Liquid Staking ($FEED) & Quadratic Voting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={plusJakartaSans.variable}>
      <body className="antialiased bg-soft-cream text-deep-navy min-h-screen flex flex-col font-sans selection:bg-canteen-amber selection:text-deep-navy">
        <MeshProviderWrapper>
          <ClientLayout>{children}</ClientLayout>
        </MeshProviderWrapper>
      </body>
    </html>
  );
}
