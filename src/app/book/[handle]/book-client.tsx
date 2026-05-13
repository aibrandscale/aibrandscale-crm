"use client";

import { useMemo, useState, useTransition } from "react";
import type { BookingProfile, AvailabilitySlot, Booking } from "@/lib/booking-store";
import { computeSlotsForDate, computeAvailableDaysInMonth } from "@/lib/slots";

type BookingShape = Pick<Booking, "startAt" | "endAt" | "status">;

export function BookClient({
  profile,
  hostName,
  availability,
  bookings,
}: {
  profile: BookingProfile;
  hostName: string;
  availability: AvailabilitySlot[];
  bookings: BookingShape[];
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<{ startAt: string; endAt: string } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ startAt: string; meetingUrl: string | null } | null>(null);
  const [pending, start] = useTransition();

  const availableDays = useMemo(
    () => new Set(computeAvailableDaysInMonth({ profile, availability, bookings, year, month })),
    [profile, availability, bookings, year, month],
  );

  const slots = useMemo(() => {
    if (!date) return [];
    return computeSlotsForDate({ profile, availability, bookings, date });
  }, [date, profile, availability, bookings]);

  function prevMonth() {
    setDate(null);
    setSlot(null);
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    setDate(null);
    setSlot(null);
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  }

  async function submit() {
    if (!slot) return;
    if (name.trim().length < 2) return setError("Името е задължително.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError("Невалиден имейл.");
    setError(null);
    start(async () => {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: profile.handle,
          startAt: slot.startAt,
          endAt: slot.endAt,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          note: note.trim() || undefined,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || profile.timezone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Грешка при запис.");
        return;
      }
      setConfirmed({ startAt: slot.startAt, meetingUrl: data.meetingUrl ?? null });
    });
  }

  if (confirmed) {
    return (
      <div style={pageStyle}>
        <div className="card" style={{ maxWidth: 520, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.01em" }}>Часът е запазен!</h2>
          <p style={{ margin: "0 0 16px", color: "var(--text-secondary)" }}>
            {formatDateTime(confirmed.startAt, profile.timezone)} ({profile.timezone})
          </p>
          {confirmed.meetingUrl && (
            <a href={confirmed.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: "inline-flex", textDecoration: "none" }}>
              Отвори Google Meet →
            </a>
          )}
          <p style={{ marginTop: 20, fontSize: 12, color: "var(--text-muted)" }}>
            Изпратихме потвърждение на <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 980,
          display: "grid",
          gridTemplateColumns: slot ? "260px 1fr 280px" : date ? "260px 1fr 220px" : "260px 1fr",
          overflow: "hidden",
        }}
      >
        {/* Left: profile */}
        <div style={{ padding: 24, borderRight: "1px solid var(--hairline)", display: "flex", flexDirection: "column", gap: 14 }}>
          <span
            aria-hidden
            style={{
              width: 46, height: 46, borderRadius: "50%",
              background: "var(--brand-gradient)", display: "inline-flex",
              alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 16,
            }}
          >
            {hostName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
          </span>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{hostName}</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em", margin: "4px 0 0" }}>{profile.title}</h1>
          </div>
          {profile.description && (
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--text-secondary)" }}>{profile.description}</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            <Meta icon="⏱" label={`${profile.defaultDurationMin} мин`} />
            <Meta icon="🎥" label="Google Meet" />
            <Meta icon="🌍" label={profile.timezone} />
          </div>
        </div>

        {/* Middle: month grid */}
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
              {monthLabel(year, month)} <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{year}</span>
            </div>
            <div style={{ display: "inline-flex", gap: 4 }}>
              <NavBtn onClick={prevMonth} dir="prev" />
              <NavBtn onClick={nextMonth} dir="next" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((w) => (
              <div key={w} style={{ textAlign: "center", padding: "4px 0" }}>{w}</div>
            ))}
          </div>
          <CalendarGrid
            year={year}
            month={month}
            availableDays={availableDays}
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setSlot(null);
            }}
          />
        </div>

        {/* Right: slots OR booking form */}
        {date && !slot && (
          <div style={{ padding: 20, borderLeft: "1px solid var(--hairline)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{dateLabel(date)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 380, overflowY: "auto" }}>
              {slots.length === 0 && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>Няма свободни часове.</div>
              )}
              {slots.map((s) => (
                <button
                  key={s.startAt}
                  onClick={() => setSlot(s)}
                  style={{
                    padding: "10px 12px", borderRadius: 8,
                    border: "1px solid var(--hairline-strong)", background: "transparent",
                    color: "var(--text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "center",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-card-hv)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {formatTime(s.startAt, profile.timezone)}
                </button>
              ))}
            </div>
          </div>
        )}

        {date && slot && (
          <div style={{ padding: 20, borderLeft: "1px solid var(--hairline)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{dateLabel(date)}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>{formatTime(slot.startAt, profile.timezone)} · {profile.defaultDurationMin} мин</div>
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input className="input" placeholder="Име" value={name} onChange={(e) => setName(e.target.value)} required />
              <input className="input" type="email" placeholder="Имейл" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className="input" placeholder="Телефон (по избор)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <textarea className="input" placeholder="Бележка (по избор)" rows={2} style={{ resize: "vertical" }} value={note} onChange={(e) => setNote(e.target.value)} />
              {error && <p style={{ margin: 0, color: "var(--danger)", fontSize: 12, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, padding: "8px 10px" }}>{error}</p>}
              <button type="submit" className="btn-primary" disabled={pending} style={{ opacity: pending ? 0.7 : 1 }}>
                {pending ? "Записваме…" : "Запази час"}
              </button>
              <button type="button" onClick={() => setSlot(null)} style={{ background: "transparent", border: 0, color: "var(--text-muted)", fontSize: 12, cursor: "pointer", marginTop: 2 }}>
                ← Друг час
              </button>
            </form>
          </div>
        )}
      </div>
      <p style={{ marginTop: 14, fontSize: 11, color: "var(--text-muted)" }}>aibrandscale CRM</p>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 16px",
  background: "radial-gradient(ellipse at top, rgba(144,60,165,0.18) 0%, transparent 55%), var(--bg-primary)",
};

function CalendarGrid({
  year,
  month,
  availableDays,
  selected,
  onSelect,
}: {
  year: number;
  month: number;
  availableDays: Set<string>;
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  // Convert Sun=0..Sat=6 to Mon=0..Sun=6
  const firstWeekday = (first.getUTCDay() + 6) % 7;
  const lastDate = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= lastDate; d += 1) {
    cells.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
      {cells.map((d, i) => {
        if (!d) return <div key={i} style={{ height: 38 }} />;
        const isAvailable = availableDays.has(d);
        const isSelected = selected === d;
        const day = parseInt(d.split("-")[2], 10);
        return (
          <button
            key={d}
            onClick={() => isAvailable && onSelect(d)}
            disabled={!isAvailable}
            style={{
              height: 38, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isAvailable ? "pointer" : "default",
              color: isSelected ? "#fff" : isAvailable ? "var(--text-primary)" : "var(--text-muted)",
              background: isSelected ? "var(--brand-gradient)" : isAvailable ? "var(--surface-card-hv)" : "transparent",
              border: "1px solid",
              borderColor: isSelected ? "transparent" : isAvailable ? "var(--hairline)" : "transparent",
              opacity: isAvailable ? 1 : 0.4,
              transition: "background 150ms ease",
            }}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
}

function NavBtn({ onClick, dir }: { onClick: () => void; dir: "prev" | "next" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 30, height: 30, borderRadius: 8, background: "var(--surface-card-hv)",
        border: "1px solid var(--hairline)", color: "var(--text-secondary)", cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}
      aria-label={dir === "prev" ? "Предишен месец" : "Следващ месец"}
    >
      {dir === "prev" ? "‹" : "›"}
    </button>
  );
}

function Meta({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("bg-BG", { month: "long" });
}

function dateLabel(d: string) {
  return new Date(`${d}T12:00:00Z`).toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long" });
}

function formatTime(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });
}

function formatDateTime(iso: string, tz: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long", timeZone: tz })} · ${formatTime(iso, tz)}`;
}
