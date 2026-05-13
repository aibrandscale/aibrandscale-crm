"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BookingProfile, AvailabilitySlot } from "@/lib/booking-store";

const WEEKDAYS = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const WEEKDAY_FULL = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"];

type WindowState = { startMinute: number; endMinute: number };
type WeekState = WindowState[][];

function buildInitial(slots: AvailabilitySlot[]): WeekState {
  const out: WeekState = Array.from({ length: 7 }, () => []);
  for (const s of slots) out[s.weekday].push({ startMinute: s.startMinute, endMinute: s.endMinute });
  return out;
}

function fmt(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTime(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 24 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function SetupClient({
  profile,
  initialAvailability,
}: {
  profile: BookingProfile;
  initialAvailability: AvailabilitySlot[];
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [handle, setHandle] = useState(profile.handle);
  const [title, setTitle] = useState(profile.title);
  const [description, setDescription] = useState(profile.description ?? "");
  const [duration, setDuration] = useState(profile.defaultDurationMin);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [minNotice, setMinNotice] = useState(profile.minNoticeMin);
  const [maxAdvance, setMaxAdvance] = useState(profile.maxAdvanceDays);
  const [buffer, setBuffer] = useState(profile.bufferMin);
  const [week, setWeek] = useState<WeekState>(buildInitial(initialAvailability));

  function addWindow(day: number) {
    setWeek((w) => {
      const next = w.map((d) => [...d]);
      next[day].push({ startMinute: 9 * 60, endMinute: 18 * 60 });
      return next;
    });
  }
  function removeWindow(day: number, idx: number) {
    setWeek((w) => {
      const next = w.map((d) => [...d]);
      next[day].splice(idx, 1);
      return next;
    });
  }
  function setStart(day: number, idx: number, v: string) {
    const min = parseTime(v);
    if (min == null) return;
    setWeek((w) => {
      const next = w.map((d) => [...d]);
      next[day][idx] = { ...next[day][idx], startMinute: min };
      return next;
    });
  }
  function setEnd(day: number, idx: number, v: string) {
    const min = parseTime(v);
    if (min == null) return;
    setWeek((w) => {
      const next = w.map((d) => [...d]);
      next[day][idx] = { ...next[day][idx], endMinute: min };
      return next;
    });
  }
  function toggleDay(day: number) {
    setWeek((w) => {
      const next = w.map((d) => [...d]);
      if (next[day].length > 0) next[day] = [];
      else next[day] = [{ startMinute: 9 * 60, endMinute: 18 * 60 }];
      return next;
    });
  }

  function onSave() {
    setError(null);
    setSaved(false);
    const slots: { weekday: number; startMinute: number; endMinute: number }[] = [];
    for (let day = 0; day < 7; day += 1) {
      for (const w of week[day]) {
        if (w.endMinute <= w.startMinute) {
          setError(`Невалидни часове за ${WEEKDAY_FULL[day]}.`);
          return;
        }
        slots.push({ weekday: day, startMinute: w.startMinute, endMinute: w.endMinute });
      }
    }
    start(async () => {
      const res = await fetch("/api/booking/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: handle.trim().toLowerCase(),
          title,
          description,
          defaultDurationMin: Number(duration),
          timezone,
          minNoticeMin: Number(minNotice),
          maxAdvanceDays: Number(maxAdvance),
          bufferMin: Number(buffer),
          availability: slots,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Грешка при запис.");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    });
  }

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/book/${handle}` : `/book/${handle}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionHeader title="Публичен профил" sub="Линкът, който споделяш с хората." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Handle (URL)">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", whiteSpace: "nowrap" }}>
                /book/
              </span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                className="input"
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
              />
            </div>
          </Field>
          <Field label="Часова зона">
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="input">
              <option value="Europe/Sofia">Europe/Sofia</option>
              <option value="Europe/Berlin">Europe/Berlin</option>
              <option value="Europe/London">Europe/London</option>
              <option value="UTC">UTC</option>
            </select>
          </Field>
        </div>
        <Field label="Заглавие">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </Field>
        <Field label="Описание (по избор)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            rows={3}
            style={{ resize: "vertical" }}
            placeholder="Кратко описание което гостът ще види."
          />
        </Field>
      </div>

      <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionHeader title="Параметри на разговора" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <Field label="Продължителност (мин)">
            <input type="number" min={5} max={240} step={5} value={duration} onChange={(e) => setDuration(parseInt(e.target.value || "0", 10))} className="input" />
          </Field>
          <Field label="Min notice (мин)">
            <input type="number" min={0} max={1440} step={15} value={minNotice} onChange={(e) => setMinNotice(parseInt(e.target.value || "0", 10))} className="input" />
          </Field>
          <Field label="Max advance (дни)">
            <input type="number" min={1} max={180} value={maxAdvance} onChange={(e) => setMaxAdvance(parseInt(e.target.value || "0", 10))} className="input" />
          </Field>
          <Field label="Buffer (мин)">
            <input type="number" min={0} max={60} step={5} value={buffer} onChange={(e) => setBuffer(parseInt(e.target.value || "0", 10))} className="input" />
          </Field>
        </div>
      </div>

      <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        <SectionHeader title="Работни часове" sub="Маркирай дните и часовете в които приемаш разговори." />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3, 4, 5, 6, 0].map((day) => (
            <div key={day} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: week[day].length > 0 ? "rgba(144,60,165,0.08)" : "transparent", border: "1px solid var(--hairline)" }}>
              <button
                type="button"
                onClick={() => toggleDay(day)}
                style={{
                  width: 18, height: 18, borderRadius: 5, background: week[day].length > 0 ? "var(--brand-gradient)" : "transparent",
                  border: "1px solid var(--hairline-strong)", cursor: "pointer", flexShrink: 0,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12,
                }}
                aria-label={`Toggle ${WEEKDAY_FULL[day]}`}
              >
                {week[day].length > 0 ? "✓" : ""}
              </button>
              <span style={{ width: 110, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{WEEKDAY_FULL[day]}</span>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {week[day].length === 0 ? (
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>Неактивен</span>
                ) : (
                  week[day].map((w, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="time" value={fmt(w.startMinute)} onChange={(e) => setStart(day, idx, e.target.value)} className="input" style={{ width: 100 }} />
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                      <input type="time" value={fmt(w.endMinute)} onChange={(e) => setEnd(day, idx, e.target.value)} className="input" style={{ width: 100 }} />
                      <button type="button" onClick={() => removeWindow(day, idx)} style={{ background: "transparent", border: "1px solid var(--hairline)", borderRadius: 6, width: 26, height: 26, color: "var(--danger)", cursor: "pointer" }} aria-label="Премахни">×</button>
                    </div>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => addWindow(day)}
                style={{ background: "var(--surface-card-hv)", border: "1px solid var(--hairline)", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}
              >
                + Прозорец
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Публичен линк:{" "}
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            {publicUrl}
          </a>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {error && <span style={{ color: "var(--danger)", fontSize: 13 }}>{error}</span>}
          {saved && <span style={{ color: "var(--success)", fontSize: 13 }}>✓ Запазено</span>}
          <button type="button" onClick={onSave} disabled={isPending} className="btn-primary" style={{ opacity: isPending ? 0.7 : 1 }}>
            {isPending ? "Записваме…" : "Запази"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
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
