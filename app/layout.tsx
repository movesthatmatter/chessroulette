import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { Metadata } from 'next';
import { HeroUIProvider } from '@heroui/system';
// import '../styles.css';
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: 'Home | Chessroulette',
  description: '',
};

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <HeroUIProvider>{children}</HeroUIProvider>
        <SpeedInsights />
      </body>

      {/* Simple Analytics */}
      <script
        data-collect-dnt="true"
        async
        src="https://scripts.simpleanalyticscdn.com/latest.js"
      />
      <Analytics />
    </html>
  );
}
