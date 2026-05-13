import { getAllEvents, type Event } from "@/lib/events-store";
import { getAllLeads } from "@/lib/leads-store";
import { formatDate, formatTime } from "@/lib/format";
import { CreateEventCard } from "./create-event-card";
import { EventActions } from "./event-actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<Event["status"], string> = {
  draft: "Чернова",
  upcoming: "Предстоящ",
  live: "На живо",
  past: "Минал",
};

const STATUS_COLOR: Record<Event["status"], { fg: string; bg: string; bd: string }> = {
  draft: { fg: "#9CA3AF", bg: "rgba(156,163,175,0.10)", bd: "rgba(156,163,175,0.25)" },
  upcoming: { fg: "#60A5FA", bg: "rgba(96,165,250,0.10)", bd: "rgba(96,165,250,0.25)" },
  live: { fg: "#4ADE80", bg: "rgba(74,222,128,0.10)", bd: "rgba(74,222,128,0.25)" },
  past: { fg: "#A78BFA", bg: "rgba(167,139,250,0.10)", bd: "rgba(167,139,250,0.25)" },
};

export default async function EventsPage() {
  const [events, allLeads] = await Promise.all([getAllEvents(), getAllLeads()]);

  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ padding: "32px clamp(20px, 3vw, 40px)" }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          CRM · Events
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "6px 0 0" }}>
          Уебинари / Events
        </h1>
        <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: 14, maxWidth: 720 }}>
          Всеки уебинар (15 април, май, юли…) е отделен event. Лийдовете се прикачат към активния event и
          могат да се филтрират / групират в статистиките и имейл кампаниите.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 380px)", gap: 18 }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Всички уебинари</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{events.length} общо</span>
          </div>
          {events.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              Все още няма events. Създай първия отдясно →
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Дата</th>
                  <th style={{ textAlign: "right" }}>Лийдове</th>
                  <th>Статус</th>
                  <th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((ev) => {
                  const count = allLeads.filter((l) => l.eventId === ev.id || l.eventSlug === ev.slug).length;
                  const c = STATUS_COLOR[ev.status];
                  return (
                    <tr key={ev.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {ev.isActive && (
                            <span
                              aria-label="Активен"
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "#4ADE80",
                                boxShadow: "0 0 8px rgba(74,222,128,0.7)",
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <div>
                            <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{ev.name}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                              {ev.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ color: "var(--text-primary)" }}>{formatDate(ev.date)}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatTime(ev.date)}</div>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                        {count}
                      </td>
                      <td>
                        <span className="badge" style={{ color: c.fg, background: c.bg, borderColor: c.bd }}>
                          {STATUS_LABEL[ev.status]}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <EventActions event={ev} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <CreateEventCard />
      </div>
    </div>
  );
}
