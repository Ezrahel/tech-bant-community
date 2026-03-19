import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Tech Content Community Platform',
  description: 'A focused community for discussions, reviews, support, and product conversations.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
