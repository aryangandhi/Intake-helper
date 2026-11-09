import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intake Prototype (class project)",
  description: "Clickable prototype of an AI-assisted oncology intake workflow. Fictional data only.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <div role="note" className="no-print bg-yellow-300 text-black text-center text-sm font-semibold px-3 py-1">
          Class prototype. Fictional data only. Do not enter real personal health information.
        </div>
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="no-print border-t border-gray-200 bg-gray-50 text-gray-700 text-xs text-center px-3 py-2">
          University class prototype (CS497/HLTH480). Not affiliated with, or endorsed by, WRHN, Oracle Health or MyConnectedCare.
        </footer>
      </body>
    </html>
  );
}
