import { STATUS_LABEL, STATUS_COLOR, type Lead } from "@/lib/mock-data";
import { getAllLeads } from "@/lib/leads-store";
import { getAllEvents } from "@/lib/events-store";
import { formatDateTime, relativeTime } from "@/lib/format";
import { EventFilter } from "./event-filter";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ event?: string }>;

export default async function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const eventFilter = params.event;
  const [stored, events] = await Promise.all([getAllLeads(), getAllEvents()]);
  let leads = stored;
  if (eventFilter && eventFilter !== "all") {
    leads = leads.filter((l) => l.eventSlug === eventFilter || l.eventId === eventFilter);
  }
  const eventNameById = new Map(events.map((e) => [e.id, e.name]));
  const eventNameBySlug = new Map(events.map((e) => [e.slug, e.name]));
  const newCount = leads.filter((l) => l.status === "new").length;

  return (
    <div style={{ padding: "32px clamp(20px, 3vw, 40px)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            CRM · Leads
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "6px 0 0" }}>
            Всички лийдове
          </h1>
          <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
            {leads.length} общо · {newCount} нови
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary">Експорт CSV</button>
          <button className="btn-primary">Нов lead</button>
        </div>
      </header>

      <KPIRow leads={leads} />

      <div className="card" style={{ marginTop: 24, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--hairline)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Списък</span>
            <EventFilter events={events} current={eventFilter} />
          </div>
          <input className="input" type="search" placeholder="Търси по име, имейл, телефон…" style={{ maxWidth: 320 }} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Контакт</th>
                <th>Имейл</th>
                <th>Телефон</th>
                <th>Event</th>
                <th>Източник</th>
                <th>Статус</th>
                <th>Постъпил</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <LeadRow
                  key={l.id}
                  lead={l}
                  eventName={
                    (l.eventId && eventNameById.get(l.eventId)) ||
                    (l.eventSlug && eventNameBySlug.get(l.eventSlug)) ||
                    null
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPIRow({ leads }: { leads: Lead[] }) {
  const buckets: { label: string; key: Lead["status"] | "total" }[] = [
    { label: "Общо", key: "total" },
    { label: "Нови", key: "new" },
    { label: "Свързани", key: "contacted" },
    { label: "Quallified", key: "qualified" },
    { label: "Unqualified", key: "unqualified" },
  ];
  const counts: Record<string, number> = {
    total: leads.length,
    ...leads.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
      {buckets.map((b) => (
        <div key={b.key} className="card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            {b.label}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, letterSpacing: "-0.02em" }}>
            {counts[b.key] ?? 0}
          </div>
        </div>
      ))}
    </div>
  );
}

function LeadRow({ lead, eventName }: { lead: Lead; eventName: string | null }) {
  const c = STATUS_COLOR[lead.status];
  return (
    <tr>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--brand-gradient)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "#fff",
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {lead.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{lead.name}</div>
            {lead.note && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{lead.note}</div>
            )}
          </div>
        </div>
      </td>
      <td>
        <a href={`mailto:${lead.email}`} style={{ color: "var(--text-secondary)" }}>{lead.email}</a>
      </td>
      <td>
        <a href={`tel:${lead.phone.replace(/\s/g, "")}`} style={{ color: "var(--text-secondary)" }}>{lead.phone}</a>
      </td>
      <td>
        {eventName ? (
          <span style={{ color: "var(--text-primary)", fontSize: 13 }}>{eventName}</span>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: 12, fontStyle: "italic" }}>—</span>
        )}
      </td>
      <td>{lead.source}</td>
      <td>
        <span className="badge" style={{ color: c.fg, background: c.bg, borderColor: c.bd }}>
          {STATUS_LABEL[lead.status]}
        </span>
      </td>
      <td>
        <div style={{ color: "var(--text-primary)" }}>{relativeTime(lead.createdAt)}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{formatDateTime(lead.createdAt)}</div>
      </td>
      <td style={{ textAlign: "right" }}>
        <button
          aria-label="Опции"
          style={{
            background: "transparent",
            border: "1px solid var(--hairline)",
            borderRadius: 6,
            width: 28,
            height: 28,
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          ⋯
        </button>
      </td>
    </tr>
  );
}
