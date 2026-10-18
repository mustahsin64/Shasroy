"use client";

import { useActionState } from "react";
import { changeOrderStatusAction, type StatusActionState } from "./actions";

export function StatusForm({ orderId, options }: { orderId: string; options: { value: string; label: string; danger?: boolean }[] }) {
  const [state, action, pending] = useActionState<StatusActionState, FormData>(changeOrderStatusAction, {});
  return <form action={action} className="admin-form status-form">
    <input type="hidden" name="orderId" value={orderId} />
    <label htmlFor="note">নোট (ঐচ্ছিক)</label>
    <input id="note" name="note" maxLength={500} placeholder="যেমন: ফোনে নিশ্চিত করা হয়েছে" />
    <div className="status-buttons">
      {options.map(option => <button key={option.value} type="submit" name="status" value={option.value} disabled={pending} className={option.danger ? "danger" : undefined}
        onClick={event => { if (option.danger && !confirm("অর্ডারটি বাতিল করবেন? স্টক ফেরত যাবে।")) event.preventDefault(); }}>
        {option.label}
      </button>)}
    </div>
    {state.error && <p className="admin-error" role="alert">{state.error}</p>}
  </form>;
}
