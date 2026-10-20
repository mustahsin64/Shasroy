"use client";

import { ActionForm } from "@/components/admin/action-form";
import { addOrderNoteAction } from "./notes-actions";

export function NotesForm({ orderId }: { orderId: string }) {
  return <ActionForm action={addOrderNoteAction} submitLabel="নোট যোগ করুন" className="notes-form">
    <input type="hidden" name="orderId" value={orderId} />
    <label htmlFor="note-body">নতুন নোট (শুধু অ্যাডমিনরা দেখবেন)</label>
    <textarea id="note-body" name="body" rows={3} maxLength={2000} required placeholder="যেমন: গ্রাহক সন্ধ্যায় ফোন চেয়েছেন / কুরিয়ার ট্র্যাকিং নম্বর…" />
  </ActionForm>;
}
