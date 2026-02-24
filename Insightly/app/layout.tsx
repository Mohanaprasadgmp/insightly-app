import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Reportiq — AI-Powered Client Reporting",
    template: "%s | Reportiq",
  },
  description:
    "Automate your agency's client reporting with AI-generated insights. Connect GA4 and Meta Ads, generate narratives, and deliver beautiful white-labeled PDF reports.",
  keywords: ["client reporting", "marketing agency", "AI reports", "GA4", "Meta Ads"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
