import { Jost } from "next/font/google";

/** The brand font, shared by every root layout. Exposes `--font-jost` on the element it's applied to. */
export const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["200", "300", "400"],
});
