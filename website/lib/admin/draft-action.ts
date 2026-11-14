/** Result plumbing for the draft actions. Pure and dependency-free, so it is testable. */

export type ActionResult = { ok: true } | { ok: false; error: string };
export type ActionFailure = Extract<ActionResult, { ok: false }>;

export interface Admin {
  userId: string;
  email: string;
}

export const SESSION_EXPIRED = "Your session has expired. Sign in again in another tab, then save.";
export const ACTION_FAILED = "Something went wrong. Try again.";

/**
 * Runs a draft action for a signed-in admin and always answers with a result: never a redirect
 * (which would unmount the editor and lose unsaved edits) and never a thrown error.
 */
export async function runDraftAction<T extends ActionResult>(
  name: string,
  getAdmin: () => Promise<Admin | null>,
  action: (admin: Admin) => Promise<T>,
): Promise<T | ActionFailure> {
  try {
    const admin = await getAdmin();
    if (!admin) return { ok: false, error: SESSION_EXPIRED };
    return await action(admin);
  } catch (error) {
    console.error(`${name} failed:`, error);
    return { ok: false, error: ACTION_FAILED };
  }
}
