import type { Metadata } from "next";
import { Jost } from "next/font/google";
import { SITE } from "@/lib/data/site";
import { formatHoursSummary } from "@/lib/format";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["200", "300", "400"],
});

export const metadata: Metadata = {
  title: SITE.brandName,
  description: `Hair salon in ${SITE.address.town}, London. Cut, colour, perm and treatments, by appointment. Open ${formatHoursSummary(", ")}.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={jost.variable}>
      <body>{children}</body>
    </html>
  );
}
