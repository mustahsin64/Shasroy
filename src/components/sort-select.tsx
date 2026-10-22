"use client";
import { useRouter } from "next/navigation";

/** Sort dropdown; each option carries its full destination so query and category are preserved. */
export function SortSelect({ options, current }: { options: { value: string; label: string; href: string }[]; current: string }) {
  const router = useRouter();
  return (
    <label className="sort-select">
      <span>সাজান</span>
      <select value={current} onChange={event => router.push(options.find(o => o.value === event.target.value)?.href ?? "/", { scroll: false })}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
