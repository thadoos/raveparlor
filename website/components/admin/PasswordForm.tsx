"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/(admin)/admin/actions";
import type { AuthState } from "@/app/(admin)/admin/actions";
import styles from "./PasswordForm.module.css";

interface PasswordFormProps {
  /** The signed-in admin, filled in as a hidden username so password managers update the right entry. */
  email: string;
}

const INITIAL: AuthState = {};

export function PasswordForm({ email }: PasswordFormProps) {
  const [state, action, pending] = useActionState(changePassword, INITIAL);
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="username" autoComplete="username" value={email} readOnly />
      <label className={styles.field}>
        <span className="admin-label">Current password</span>
        <input
          className="admin-input"
          type="password"
          name="current"
          autoComplete="current-password"
          required
        />
      </label>
      <label className={styles.field}>
        <span className="admin-label">New password</span>
        <input
          className="admin-input"
          type="password"
          name="new"
          autoComplete="new-password"
          minLength={10}
          required
        />
      </label>
      <label className={styles.field}>
        <span className="admin-label">Confirm new password</span>
        <input
          className="admin-input"
          type="password"
          name="confirm"
          autoComplete="new-password"
          minLength={10}
          required
        />
      </label>
      <div aria-live="polite">
        {state.error ? (
          <p className="admin-error">{state.error}</p>
        ) : state.ok ? (
          <p className="admin-success">Password changed.</p>
        ) : null}
      </div>
      <button type="submit" className="admin-button" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
