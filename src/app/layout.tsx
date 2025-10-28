import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from "sonner";
import { Providers } from '@/services/providers/providers';

export const metadata: Metadata = {
  title: 'Mystc Dashboard',
  description: 'Healthcare services dashboard',
  icons: {
    icon: "/dummy-logo.png"
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/my-logo.jpg" />
        <link rel="shortcut icon" href="/my-logo.jpg" />
        <link rel="apple-touch-icon" href="/my-logo.jpg" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}
