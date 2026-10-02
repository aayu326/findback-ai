import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://findback-ai-two.vercel.app'),

  title: {
    default: 'FindBack AI — AI-Powered Lost & Found',
    template: '%s | FindBack AI',
  },

  description:
    'FindBack AI is an AI-powered lost and found platform for colleges, offices, hostels, hospitals, malls and organizations.',

  keywords: [
    'AI lost and found',
    'lost and found management system',
    'lost and found software',
    'lost and found platform',
    'AI lost item matching',
    'digital lost and found',
    'college lost and found system',
    'office lost and found system',
    'hospital lost and found system',
    'hostel lost and found system',
    'mall lost and found system',
  ],

  authors: [
    {
      name: 'FindBack AI',
    },
  ],

  creator: 'FindBack AI',

  alternates: {
    canonical: 'https://findback-ai-two.vercel.app/',
  },

  // Google Search Console verification
  verification: {
    google: '9chHnX9pN6eVXnhfdEgc6vf3yeS5kbXlc7XMdc8gY1U',
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://findback-ai-two.vercel.app/',
    siteName: 'FindBack AI',
    title: 'FindBack AI — AI-Powered Lost & Found',
    description:
      'Find, match, verify and return lost items with AI-powered lost and found management.',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'FindBack AI — AI-Powered Lost & Found',
    description:
      'AI-powered lost and found management for colleges, offices, hostels, hospitals, malls and organizations.',
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
