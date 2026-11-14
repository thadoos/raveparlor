import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminApp } from "@/components/admin/AdminApp";
import { loadDraft } from "@/app/(admin)/admin/actions";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Content" };

/** Reads the session and both content rows, so it streams in behind the boundary. */
async function AdminLoader() {
  await requireAdmin();
  const initial = await loadDraft();
  return <AdminApp initial={initial} />;
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <p className="admin-label" style={{ padding: "40px 16px" }}>
          Loading…
        </p>
      }
    >
      <AdminLoader />
    </Suspense>
  );
}
