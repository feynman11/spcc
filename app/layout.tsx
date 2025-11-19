import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { auth } from "@/auth";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "South Peaks Cycle Club",
  description: "Join our community of passionate cyclists",
  icons: {
    icon: "/spcc_logo.jpg",
    shortcut: "/spcc_logo.jpg",
    apple: "/spcc_logo.jpg",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={inter.variable}>
        <Providers session={session}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

