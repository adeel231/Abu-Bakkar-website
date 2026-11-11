"use client";
import { Trash2 } from "lucide-react";
import { deleteEnrollment } from "../actions";

/** Delete button that asks "are you sure?" first. Shown for every enrollment except an active paid (verified) one. */
export default function DeleteEnrollment({ id, label, returnTo, refunded }: { id: string; label: string; returnTo: string; refunded?: boolean }) {
  const warning = refunded
    ? `Delete enrollment ${label}?\n\nThis enrollment was refunded. Deleting it also erases its payment record and uploaded receipt, and the child and parent record if nothing else uses them.\n\nIt cannot be undone.`
    : `Delete enrollment ${label}?\n\nThis also removes its uploaded receipt and the child and parent record if nothing else uses them. It cannot be undone.`;
  return (
    <form
      action={deleteEnrollment}
      onSubmit={(e) => { if (!window.confirm(warning)) e.preventDefault(); }}
      className="border-t border-slate-100 pt-3"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="return" value={returnTo} />
      <button className="inline-flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50">
        <Trash2 size={16} /> Delete enrollment
      </button>
    </form>
  );
}
