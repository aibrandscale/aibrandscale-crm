import Link from "next/link";
import {
  STATUS_LABEL,
  STATUS_COLOR,
  type Lead,
} from "@/lib/mock-data";
import { getAllLeads } from "@/lib/leads-store";
import { getAllEvents } from "@/lib/events-store";
import { listAllBookings, type Booking } from "@/lib/booking-store";
import { formatDateTime, relativeTime, formatTime, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

export default async function DashboardPage() {
  const [leadsList, events, bookings] = await Promise.all([
    getAllLeads(),
    getAllEvents(),
    listAllBookings(),
  ]);
  const leads: Lead[] = leadsList;
  const calls: Booking[] = bookings;

  const now = Date.now();
  const todayKey = new Date().toISOString().slice(0, 10);

  const totalLeads = leads.length;
  const leadsToday = leads.filter((l) => l.createdAt.slice(0, 10) === todayKey).length;
  const leadsWeek = leads.filter((l) => now - new Date(l.createdAt).getTime() < 7 * DAY_MS).length;
  const qualified = leads.filter((l) => l.status === "qualified").length;
  const newCount = leads.filter((l) => l.status === "new").length;

  const upcoming = calls.filter((c) => c.status === "confirmed" && new Date(c.startAt).getTime() > now);
  const callsToday = calls.filter((c) => c.startAt.slice(0, 10) === todayKey).length;
  const completed = calls.filter((c) => c.status === "completed").length;
  const noShow = calls.filter((c) => c.status === "no_show").length;
  const showUp =
    completed + noShow > 0 ? Math.round((completed / (completed + noShow)) * 100) : null;

  const recentLeads = leads.slice(0, 5);
  const nextCalls = upcoming.slice(0, 5);

  const eventStats = events
    .map((ev) => {
      const count = leads.filter((l) => l.eventId === ev.id || l.eventSlug === ev.slug).length;
      return { ev, count };
    })
    .sort((a, b) => b.count - a.count);
  const maxEventCount = Math.max(...eventStats.map((s) => s.count), 1);

  return (
    <div style={{ padding: "32px clamp(20px, 3vw, 40px)" }}>
      <header style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          CRM · Dashboard
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "6px 0 0" }}>
          Здрасти, добре дошъл
        </h1>
        <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
          Кратък преглед на това какво се случва днес.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <KpiCard label="Общо лийдове" value={totalLeads} sub={`${leadsToday} днес · ${leadsWeek} тази седмица`} accent="violet" />
        <KpiCard label="Нови" value={newCount} sub="Чакат първи контакт" accent="warning" />
        <KpiCard label="Quallified" value={qualified} sub="Готови за разговор" accent="success" />
        <KpiCard label="Предстоящи разговори" value={upcoming.length} sub={`${callsToday} запазени за днес`} accent="info" />
        <KpiCard
          label="Show-up rate"
          value={showUp === null ? "—" : `${showUp}%`}
          sub={`${completed} проведени · ${noShow} no-show`}
          accent="success"
        />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 24 }}>
        <Card title="Последни лийдове" linkHref="/leads" linkLabel="Виж всички">
          {recentLeads.length === 0 ? (
            <Empty label="Все още няма лийдове" />
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
              {recentLeads.map((l, i) => (
                <li
                  key={l.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 18px",
                    borderTop: i === 0 ? "none" : "1px solid var(--hairline-soft)",
                  }}
                >
                  <Avatar name={l.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {relativeTime(l.createdAt)} · {l.source}
                    </div>
                  </div>
                  <StatusPill status={l.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Предстоящи разговори" linkHref="/calls" linkLabel="Виж всички">
          {nextCalls.length === 0 ? (
            <Empty label="Няма запазени разговори" />
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
              {nextCalls.map((c, i) => (
                <li
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 18px",
                    borderTop: i === 0 ? "none" : "1px solid var(--hairline-soft)",
                  }}
                >
                  <DateBubble iso={c.startAt} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14 }}>{c.guestName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {formatTime(c.startAt)} · {c.durationMin} мин
                    </div>
                  </div>
                  <a
                    href={c.meetingUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      color: "var(--text-secondary)",
                      padding: "4px 10px",
                      border: "1px solid var(--hairline)",
                      borderRadius: 8,
                      fontSize: 12,
                      background: "var(--surface-card)",
                    }}
                  >
                    Meet
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Лийдове по уебинар" linkHref="/events" linkLabel="Виж events">
          {eventStats.length === 0 ? (
            <Empty label="Все още няма events" />
          ) : (
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              {eventStats.map(({ ev, count }) => {
                const pct = (count / maxEventCount) * 100;
                return (
                  <div key={ev.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, fontSize: 13 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        {ev.isActive && (
                          <span
                            aria-label="Активен"
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "#4ADE80",
                              boxShadow: "0 0 6px rgba(74,222,128,0.7)",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{formatDate(ev.date)}</div>
                        </div>
                      </div>
                      <span style={{ color: "var(--text-primary)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{count}</span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: "var(--hairline)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "var(--brand-gradient)",
                          boxShadow: "0 0 12px rgba(144,60,165,0.4)",
                          borderRadius: 999,
                          transition: "width 600ms ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Бързи действия">
          <div style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <ActionLink href="/leads" label="Виж нови лийдове" badge={newCount} />
            <ActionLink href="/calls" label="Разговори днес" badge={callsToday} />
            <ActionLink href="/leads" label="Добави lead ръчно" />
            <ActionLink href="/calls" label="Свържи Google Calendar" />
          </div>
        </Card>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: "violet" | "success" | "warning" | "info";
}) {
  const tints: Record<NonNullable<typeof accent>, string> = {
    violet: "rgba(144,60,165,0.22)",
    success: "rgba(74,222,128,0.18)",
    warning: "rgba(250,204,21,0.18)",
    info: "rgba(96,165,250,0.18)",
  };
  return (
    <div
      className="card"
      style={{
        padding: "18px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {accent && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${tints[accent]}, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8, letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  linkHref,
  linkLabel,
  children,
}: {
  title: string;
  linkHref?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
        {linkHref && (
          <Link href={linkHref} style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>
            {linkLabel ?? "Виж"} →
          </Link>
        )}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div style={{ padding: "28px 18px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
      {label}
    </div>
  );
}

function StatusPill({ status }: { status: Lead["status"] }) {
  const c = STATUS_COLOR[status];
  return (
    <span className="badge" style={{ color: c.fg, background: c.bg, borderColor: c.bd, fontSize: 10 }}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "var(--brand-gradient)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        color: "#fff",
        fontSize: 12,
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

function DateBubble({ iso }: { iso: string }) {
  const d = new Date(iso);
  const day = d.getDate();
  const month = new Intl.DateTimeFormat("bg-BG", { month: "short" }).format(d);
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: "var(--surface-card)",
        border: "1px solid var(--hairline)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1, color: "var(--text-primary)" }}>{day}</span>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 2 }}>
        {month}
      </span>
    </div>
  );
}

function ActionLink({ href, label, badge }: { href: string; label: string; badge?: number }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: "12px 14px",
        borderRadius: 10,
        background: "var(--surface-card)",
        border: "1px solid var(--hairline)",
        color: "var(--text-primary)",
        textDecoration: "none",
        fontSize: 13,
        fontWeight: 500,
        transition: "background 200ms ease",
      }}
    >
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            background: "var(--brand-gradient)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            minWidth: 22,
            textAlign: "center",
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
