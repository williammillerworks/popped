import type { Metadata } from "next";
import { Aleo, Inter } from "next/font/google";
import "./globals.css";

const aleo = Aleo({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-aleo",
  weight: ["400", "700"],
});

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "POPPED",
  description: "A daily K-pop audio guessing game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${aleo.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
