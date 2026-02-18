import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSA Grinders - Time Slot Tester",
  description: "Testing dashboard for time-slot based messaging system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <header className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                DSA Grinders Time Slot Tester
              </h1>
              <p className="text-gray-600">
                Debug dashboard for testing time-slot based messaging system
              </p>
            </header>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}