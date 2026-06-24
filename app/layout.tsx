// Import the Metadata type from Next.js
// This helps ensure the metadata object follows correct structure (type safety)
import type { Metadata } from "next";

// Import Google Font (Inter) using Next.js built-in font optimization
import { Inter } from "next/font/google";

// Import global CSS styles that apply to the entire app
import "./globals.css";

// Import a custom Providers wrapper (likely for Context, Auth, Theme, etc.)
import Providers from "@/components/Providers";

// Initialize the Inter font with Latin subset
// Next.js optimizes and self-hosts this font automatically
const inter = Inter({ subsets: ["latin"] });

// Define global metadata for the entire application
// This is used for SEO and browser tab information
export const metadata: Metadata = {
  title: "TaskFlow - Streamline Your Tasks",
  description: "A premium Kanban-style task management flow to organize your life.",
};

// Root layout component (wraps all pages in the App Router)
// Every page in the app is rendered inside this layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Root HTML structure of the app
    <html lang="en">

      {/* Body tag where the entire React app is rendered */}
      {/* Apply Inter font globally via className */}
      <body className={inter.className}>

        {/* Providers wrapper likely supplies global state (e.g., auth, theme, queries) */}
        <Providers>

          {/* Render the current page content */}
          {children}

        </Providers>

      </body>
    </html>
  );
}