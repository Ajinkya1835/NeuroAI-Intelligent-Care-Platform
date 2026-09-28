import './globals.css';

export const metadata = {
  title: 'NeuroAI Care Suite',
  description: 'Intelligent Care Platform',
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