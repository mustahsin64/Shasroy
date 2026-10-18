"use client";

import { useActionState } from "react";
import { sendLoginLinkAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendLoginLinkAction, { status: "idle", message: "" });
  if (state.status === "sent") return <p className="admin-notice" role="status">{state.message}</p>;
  return <form action={action} className="admin-form">
    <label htmlFor="email">ইমেইল</label>
    <input id="email" name="email" type="email" autoComplete="email" required />
    {state.status === "error" && <p className="admin-error" role="alert">{state.message}</p>}
    <button type="submit" disabled={pending}>{pending ? "পাঠানো হচ্ছে…" : "লগইন লিংক পাঠান"}</button>
  </form>;
}
