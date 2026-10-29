import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'A5 Automation • WhatsApp Campaigns & Lead Command Center',
  description: 'Enterprise Meta WhatsApp Cloud API Campaign Broadcaster, Template Studio & Real-time Lead Generation CRM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
