import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "./lib/auth-context";
import { Toaster } from "sonner";
import Navbar from "./components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Idiomoji",
  description: "Daily idiom puzzles with emojis",
  icons: {
    icon: [
      {
        url: "/logo.webp",
        type: "image/webp",
      },
    ],
  },
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
