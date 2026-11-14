"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorSheet } from "@/components/admin/EditorSheet";
import { EditorFor } from "@/components/admin/editors/EditorFor";
import type { EditorProps } from "@/components/admin/editors/types";
import { acceptMessage, parseFromPreview } from "@/lib/admin/preview-protocol";
import type { ToPreview } from "@/lib/admin/preview-protocol";
import { parseTargetKey, targetKey, targetLabel } from "@/lib/admin/targets";
import type { EditTarget } from "@/lib/admin/targets";
import styles from "./VisualMode.module.css";

/**
 * The site in an iframe (/preview), kept in sync with the draft. Clicking an editable region there
 * opens its editor in a sheet (phones) or a side panel (desktop).
 */
export function VisualMode({ draft, apply }: EditorProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [target, setTarget] = useState<EditTarget | null>(null);
  // Bumped on every "ready", so a reloaded preview gets the current draft again.
  const [readyCount, setReadyCount] = useState(0);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!frame.current || event.source !== frame.current.contentWindow) return;
      const message = acceptMessage(
        event.origin,
        window.location.origin,
        event.data,
        parseFromPreview,
      );
      if (!message) return;
      if (message.type === "ready") setReadyCount((n) => n + 1);
      else setTarget(parseTargetKey(message.target));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (readyCount === 0) return;
    const message: ToPreview = { type: "draft", content: draft };
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, [draft, readyCount]);

  const close = useCallback(() => setTarget(null), []);

  return (
    <div className={styles.visual}>
      <iframe ref={frame} className={styles.frame} src="/preview" title="Site preview" />
      {target && (
        <EditorSheet
          title={targetLabel(target, draft)}
          focusKey={targetKey(target)}
          onClose={close}
        >
          <EditorFor
            key={targetKey(target)}
            target={target}
            draft={draft}
            apply={apply}
            onOpenTarget={setTarget}
          />
        </EditorSheet>
      )}
    </div>
  );
}
