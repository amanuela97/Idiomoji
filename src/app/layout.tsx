import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "./lib/auth-context";
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Idiomoji",
  description: "Daily idiom puzzles with emojis",
  icons: [
    { rel: "icon", url: "/favicon.png" }, // fallback
    {
      rel: "icon",
      type: "image/ico",
      sizes: "32x32",
      url: "/favicon-32x32.ico",
    },
    {
      rel: "icon",
      type: "image/ico",
      sizes: "16x16",
      url: "/favicon-16x16.ico",
    },
    {
      rel: "icon",
      type: "image/ico",
      sizes: "48x48",
      url: "/favicon-48x48.ico",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
