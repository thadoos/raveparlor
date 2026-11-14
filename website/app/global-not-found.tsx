import type { Metadata } from "next";
import Link from "next/link";
import { jost } from "@/lib/fonts";
import styles from "./global-not-found.module.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

/** Unmatched URLs skip every layout (there are two root layouts), so this page brings its own. */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={jost.variable}>
      <body>
        <main className={styles.page}>
          <p className={styles.code}>404</p>
          <h1 className={styles.title}>Page not found</h1>
          <Link className={styles.home} href="/">
            Back to the home page
          </Link>
        </main>
      </body>
    </html>
  );
}
