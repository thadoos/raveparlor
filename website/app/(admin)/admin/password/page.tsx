import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { requireAdmin } from "@/lib/admin/auth";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Change password" };

/** Checks the session, so it streams in behind the boundary. */
async function AdminPasswordForm() {
  const { email } = await requireAdmin();
  return <PasswordForm email={email} />;
}

export default function PasswordPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <Link href="/admin" className={styles.back}>
          ← Back
        </Link>
        <h1 className={styles.title}>Change password</h1>
        <Suspense fallback={<p className="admin-label">Loading…</p>}>
          <AdminPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
