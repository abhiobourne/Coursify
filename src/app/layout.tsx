import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "CoursifyYT - Learn. Track. Master.",
  description: "Transform YouTube playlists into structured learning courses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1 flex flex-col">
                {children}
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
