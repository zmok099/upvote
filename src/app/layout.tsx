
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'VoteLink Spammer', // Updated title to reflect new app
  description: 'Konfigurasi dan jalankan vote spammer.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Changed font to Inter */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      {/* font-body class will now pick up Inter from tailwind.config.ts */}
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

    