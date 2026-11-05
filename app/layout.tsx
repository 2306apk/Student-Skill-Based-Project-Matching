import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Student Skill–Project Matching',
  description: 'Student Skill–Project Matching System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}

