import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { auth } from "@/auth";
import { Toaster } from "sonner";
import { ConsoleWelcome } from "@/components/ConsoleWelcome";
import { getClubConfig } from "@/lib/config/getClubConfig";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const clubConfig = getClubConfig();

// Convert hex to rgba for gradient
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const metadata: Metadata = {
  title: clubConfig.metadata.title,
  description: clubConfig.metadata.description,
  icons: {
    icon: clubConfig.logo,
    shortcut: clubConfig.logo,
    apple: clubConfig.logo,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Convert primary light color to rgba for gradient
  const primaryLightRgb = hexToRgba(clubConfig.colors.primaryLight, 0.6);
  const primaryLightRgbMid = hexToRgba(clubConfig.colors.primaryLight, 0.5);
  const primaryLightRgbEnd = hexToRgba(clubConfig.colors.primaryLight, 0.6);

  return (
    <html
      lang="en"
      className="min-h-screen"
      style={{
        // @ts-ignore - CSS variables
        "--club-primary": clubConfig.colors.primary,
        "--club-primary-hover": clubConfig.colors.primaryHover,
        "--club-primary-light": clubConfig.colors.primaryLight,
        "--club-bg-gradient-start": primaryLightRgb,
        "--club-bg-gradient-mid": primaryLightRgbMid,
        "--club-bg-gradient-end": primaryLightRgbEnd,
      } as React.CSSProperties}
    >
      <body className={`${inter.variable} min-h-screen`}>
        <ConsoleWelcome />
        <Providers session={session}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

