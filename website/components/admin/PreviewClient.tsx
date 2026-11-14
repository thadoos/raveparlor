"use client";

import { useEffect, useMemo, useState } from "react";
import { EditContext } from "@/components/edit/edit-context";
import type { EditContextValue } from "@/components/edit/edit-context";
import { EditOverlay } from "@/components/edit/EditOverlay";
import { SitePage } from "@/components/site/SitePage";
import { acceptMessage, parseToPreview } from "@/lib/admin/preview-protocol";
import type { FromPreview } from "@/lib/admin/preview-protocol";
import { parseTargetKey, targetKey } from "@/lib/admin/targets";
import type { SiteContent } from "@/lib/content/schema";
import { buildSiteView } from "@/lib/content/view";

interface PreviewClientProps {
  initial: SiteContent;
}

/** Literal read so Next inlines it in the browser bundle. */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Messages only ever go to a parent on this origin. */
function post(message: FromPreview): void {
  if (window.parent === window) return;
  window.parent.postMessage(message, window.location.origin);
}

const editContext: EditContextValue = {
  onEdit: (target) => post({ type: "edit", target: targetKey(target) }),
};

/**
 * The site inside the admin's visual mode. Renders the content the admin sends (the saved draft
 * until then) and reports clicks on editable regions instead of letting the site handle them.
 */
export function PreviewClient({ initial }: PreviewClientProps) {
  const [content, setContent] = useState(initial);
  const view = useMemo(() => buildSiteView(content, SUPABASE_URL), [content]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window.parent) return;
      const message = acceptMessage(
        event.origin,
        window.location.origin,
        event.data,
        parseToPreview,
      );
      if (message) setContent(message.content);
    }

    // Capture phase on document runs before the deck's bubble-phase link handling and React's
    // own listeners, so an editable click never navigates, opens a dialog or moves the deck.
    function onClick(event: MouseEvent) {
      const el =
        event.target instanceof Element ? event.target.closest("[data-edit-target]") : null;
      if (!el) return;
      event.preventDefault();
      event.stopPropagation();
      const target = parseTargetKey(el.getAttribute("data-edit-target") ?? "");
      if (target) editContext.onEdit(target);
    }

    window.addEventListener("message", onMessage);
    document.addEventListener("click", onClick, true);
    post({ type: "ready" });
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <EditContext value={editContext}>
      <SitePage view={view} />
      <EditOverlay />
    </EditContext>
  );
}
