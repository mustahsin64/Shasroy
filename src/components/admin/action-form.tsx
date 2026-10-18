"use client";

import { useActionState } from "react";

export type FormState = { ok?: boolean; message?: string; errors?: string[] };

/**
 * Small wrapper for admin forms: runs a Server Action, disables the submit
 * button while pending, and shows success or validation messages.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  className,
  confirmText,
  danger,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children?: React.ReactNode;
  submitLabel: string;
  className?: string;
  confirmText?: string;
  danger?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className={`admin-form ${className ?? ""}`}
    onSubmit={event => { if (confirmText && !confirm(confirmText)) event.preventDefault(); }}>
    {children}
    {state.errors && state.errors.length > 0 && <ul className="admin-error" role="alert">{state.errors.map(e => <li key={e}>{e}</li>)}</ul>}
    {state.ok && state.message && <p className="admin-success" role="status">{state.message}</p>}
    <button type="submit" disabled={pending} className={danger ? "danger" : undefined}>{pending ? "অপেক্ষা করুন…" : submitLabel}</button>
  </form>;
}
