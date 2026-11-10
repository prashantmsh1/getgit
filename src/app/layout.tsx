import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkThemeProvider } from "@/components/clerk-theme-provider";

export const metadata: Metadata = {
  title: "GetGit",
  description: "Analyze the git repo with AI",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkThemeProvider>
            <TRPCReactProvider>{children}</TRPCReactProvider>
            <Toaster />
          </ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
