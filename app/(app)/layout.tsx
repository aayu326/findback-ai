import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FindBack AI — Find what was lost. Return what was found.',
  description:
    'AI-powered lost & found for colleges, offices, hostels, hospitals and malls.',

  verification: {
    google: '9chHnX9pN6eVXnhfdEgc6vf3yeS5kbXlc7XMdc8gY1U',
  },
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
