import { Suspense } from "react";
import { loadDraft } from "@/app/(admin)/admin/actions";
import { PreviewClient } from "@/components/admin/PreviewClient";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * Checks the session itself (the proxy lets Server Action POSTs through), then renders the saved
 * draft. Visual mode replaces it with the live editor content once the preview reports ready.
 */
async function PreviewLoader() {
  await requireAdmin();
  const { draft } = await loadDraft();
  return <PreviewClient initial={draft} />;
}

export default function PreviewPage() {
  return (
    <Suspense>
      <PreviewLoader />
    </Suspense>
  );
}
