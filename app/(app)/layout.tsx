import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FindBack AI — Find what was lost. Return what was found.',
  description:
    'AI-powered lost & found for colleges, offices, hostels, hospitals and malls.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-site-verification"
          content="9chHnX9pN6eVXnhfdEgc6vf3yeS5kbXlc7XMdc8gY1U"
        />
      </head>

      <body>{children}</body>
    </html>
  );
}
