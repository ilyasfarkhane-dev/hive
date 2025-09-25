import type { Metadata } from "next";
import "./globals.css";
import "aos/dist/aos.css";
import { useAuth } from '@/context/AuthContext';
import { AuthProvider } from '@/context/AuthContext';
import AuthWrapper from '@/context/AuthWrapper';
import { I18nProvider } from '@/context/I18nProvider';



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
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css" />
      </head>
      <body>
        <I18nProvider>
          <AuthProvider>
            <AuthWrapper>
              {children}
           
            </AuthWrapper>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
