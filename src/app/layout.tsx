import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "../../context/providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import StickyHeader from "./components/header/page";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PuluForge | Build your cloud, your way.",
  description: "A self-service infrastructure management platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${inter.variable}`}>
        <div style={{ paddingTop: "64.2px" }}>
          <AuthProvider session={session}>
            <StickyHeader />
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
