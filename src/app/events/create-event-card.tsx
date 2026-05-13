"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const STATUSES = [
  { value: "upcoming", label: "Предстоящ" },
  { value: "live", label: "На живо" },
  { value: "past", label: "Минал" },
  { value: "draft", label: "Чернова" },
] as const;

export function CreateEventCard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [status, setStatus] = useState<(typeof STATUSES)[number]["value"]>("upcoming");
  const [description, setDescription] = useState("");
  const [setActive, setSetActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Името е задължително.");
    if (!effectiveSlug) return setError("Slug-ът е задължителен.");
    if (!date) return setError("Дата е задължителна.");
    const iso = new Date(`${date}T${time || "19:00"}:00+03:00`).toISOString();
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: effectiveSlug,
          date: iso,
          status,
          description: description.trim() || undefined,
          setActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Възникна грешка.");
        setLoading(false);
        return;
      }
      setName("");
      setSlug("");
      setSlugTouched(false);
      setDate("");
      setDescription("");
      setLoading(false);
      router.refresh();
    } catch {
      setError("Няма връзка със сървъра.");
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--hairline)" }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Нов уебинар</span>
      </div>
      <form onSubmit={onSubmit} style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Име">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="AI Challenge — Май 2026"
            required
            className="input"
          />
        </Field>
        <Field label={`Slug · /${effectiveSlug || "пример-event"}`}>
          <input
            type="text"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="ai-challenge-maj-2026"
            className="input"
            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13 }}
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Дата">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="input" />
          </Field>
          <Field label="Час">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input" />
          </Field>
        </div>
        <Field label="Статус">
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="input">
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Описание (по избор)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Кратка нота за уебинара."
            className="input"
            rows={2}
            style={{ resize: "vertical" }}
          />
        </Field>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
          <input
            type="checkbox"
            checked={setActive}
            onChange={(e) => setSetActive(e.target.checked)}
            style={{ accentColor: "#903CA5" }}
          />
          Направи го активен — новите лийдове ще се прикачат тук.
        </label>
        {error && (
          <p
            role="alert"
            style={{
              margin: 0,
              color: "var(--danger)",
              fontSize: 13,
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Създаваме…" : "Създай event"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
