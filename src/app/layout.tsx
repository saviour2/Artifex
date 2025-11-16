import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
	title: "Artifex - AI Repair Assistant",
	description:
		"Turn field damage into a visual repair plan with AI-powered step-by-step guides.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="antialiased">
				<Providers>{children}</Providers>
				<SpeedInsights />
			</body>
		</html>
	);
}
