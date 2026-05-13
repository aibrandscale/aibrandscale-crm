"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Event } from "@/lib/events-store";

export function EventFilter({ events, current }: { events: Event[]; current?: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(slug: string) {
    const sp = new URLSearchParams(params);
    if (!slug || slug === "all") sp.delete("event");
    else sp.set("event", slug);
    router.push(`/leads${sp.toString() ? "?" + sp.toString() : ""}`);
  }

  return (
    <select
      value={current ?? "all"}
      onChange={(e) => onChange(e.target.value)}
      className="input"
      style={{ width: "auto", minWidth: 200, padding: "8px 12px", fontSize: 13 }}
      aria-label="Филтър по event"
    >
      <option value="all">Всички events</option>
      {events.map((ev) => (
        <option key={ev.id} value={ev.slug}>
          {ev.name}
        </option>
      ))}
    </select>
  );
}
