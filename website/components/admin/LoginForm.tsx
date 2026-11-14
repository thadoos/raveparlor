"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { signIn } from "@/app/(admin)/admin/actions";
import type { AuthState } from "@/app/(admin)/admin/actions";
import styles from "./LoginForm.module.css";

interface LoginFormProps {
  /** Shown in place of the error line until the form returns its own error. */
  notice?: ReactNode;
}

const INITIAL: AuthState = {};

export function LoginForm({ notice }: LoginFormProps) {
  const [state, action, pending] = useActionState(signIn, INITIAL);
  return (
    <form action={action} className={styles.form}>
      <label className={styles.field}>
        <span className="admin-label">Email</span>
        <input
          className="admin-input"
          type="email"
          name="email"
          autoComplete="username"
          required
        />
      </label>
      <label className={styles.field}>
        <span className="admin-label">Password</span>
        <input
          className="admin-input"
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      <div aria-live="polite">
        {state.error ? <p className="admin-error">{state.error}</p> : notice}
      </div>
      <button type="submit" className="admin-button" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
