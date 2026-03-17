import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitGuru",
  description: "Ask anything about any GitHub repository. GitGuru gives you instant AI-powered insight into any codebase.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
