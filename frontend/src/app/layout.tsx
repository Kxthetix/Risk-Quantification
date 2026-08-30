import type { Metadata } from "next";
import { RootProviders } from "@/providers";
import { NetworkStatusBanner } from "@/components/feedback/NetworkStatusBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | CyberRisk Impact Platform",
    default: "CyberRisk Impact Platform — Enterprise Risk Assessment & Financial Impact",
  },
  description:
    "AI-driven cybersecurity risk scoring, financial loss modeling, attack path analysis, and security investment optimization platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <RootProviders>
          <NetworkStatusBanner />
          {children}
        </RootProviders>
      </body>
    </html>
  );
}
