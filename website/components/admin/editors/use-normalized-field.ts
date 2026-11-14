"use client";

import { useState } from "react";

/**
 * Local text for a field whose draft value must be canonical. Typing only changes the local text;
 * on blur it is normalized and committed, or kept local with an error when it can't be.
 * A new value from outside (undo, discard, another editor) replaces the local text.
 */
export function useNormalizedField(options: {
  value: string;
  normalize: (input: string) => string | null;
  format?: (value: string) => string;
  onCommit: (value: string) => void;
  /**
   * Last say on a valid new value: false puts the stored value back instead of committing (the
   * caller explains why).
   */
  accept?: (value: string) => boolean;
  invalidMessage: string;
}) {
  const { value, normalize, onCommit, accept, invalidMessage } = options;
  const format = options.format ?? ((v: string) => v);
  const [text, setText] = useState(() => format(value));
  const [synced, setSynced] = useState(value);
  const [error, setError] = useState<string | null>(null);

  if (value !== synced) {
    setSynced(value);
    setText(format(value));
    setError(null);
  }

  function onBlur() {
    const normalized = normalize(text);
    if (normalized === null) {
      setError(invalidMessage);
      return;
    }
    setError(null);
    if (normalized !== value && accept && !accept(normalized)) {
      setText(format(value));
      return;
    }
    setText(format(normalized));
    if (normalized !== value) onCommit(normalized);
  }

  return { text, setText, error, onBlur };
}
