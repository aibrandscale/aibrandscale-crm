"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Event } from "@/lib/events-store";

export function EventActions({ event }: { event: Event }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setActive() {
    setBusy(true);
    try {
      await fetch(`/api/events/${event.id}/activate`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Изтрий "${event.name}"? Лийдовете остават, но без event.`)) return;
    setBusy(true);
    try {
      await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
      {!event.isActive && (
        <button
          type="button"
          onClick={setActive}
          disabled={busy}
          className="btn-secondary"
          style={{ padding: "5px 10px", fontSize: 12 }}
          title="Направи активен"
        >
          Активирай
        </button>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        style={{
          background: "transparent",
          border: "1px solid var(--hairline)",
          borderRadius: 6,
          width: 28,
          height: 28,
          color: "var(--danger)",
          cursor: "pointer",
          fontSize: 14,
        }}
        title="Изтрий"
        aria-label="Изтрий event"
      >
        ✕
      </button>
    </div>
  );
}
