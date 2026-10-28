import type { Metadata, Viewport } from "next";
import "./font-awesome.css";
import "@assets/css/fonts.css";
import "./styles/dashboard.generated.css";

// Root layout for App Router routes only (the dashboard under /app). The
// public marketing site stays on the Pages Router with its own _app/_document.

export const metadata: Metadata = {
    title: { default: "Dashboard | Simple Migrate", template: "%s | Simple Migrate" },
    robots: { index: false, follow: false },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#20AD96",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="tw-bg-light-50">{children}</body>
        </html>
    );
}
