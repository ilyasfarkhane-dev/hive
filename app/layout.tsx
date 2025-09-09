import type { Metadata } from "next";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import "aos/dist/aos.css";
import { useAuth } from '@/context/AuthContext';
import { AuthProvider } from '@/context/AuthContext';
import AuthWrapper from '@/context/AuthWrapper';



export const metadata: Metadata = {
  title: "ICESCO Member States Portal",
  description: "ICESCO Member States Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </AuthProvider>
        <ScrollToTop />
      </body>
    </html>
  );
}
