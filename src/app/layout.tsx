import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memorise",
  description: "Memorise",
};

const inter = Inter({ weight: "400", subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={inter.className} lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oooh+Baby&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="grid min-h-screen h-screen max-h-screen w-screen max-w-screen overflow-hidden myText text-gray-950">
        {children}
      </body>
    </html>
  );
}
