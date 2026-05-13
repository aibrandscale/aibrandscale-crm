import { MOCK_CALLS, CALL_STATUS_LABEL, CALL_STATUS_COLOR, type Call } from "@/lib/mock-data";
import { formatDateTime, relativeTime } from "@/lib/format";

export default function CallsPage() {
  const calls = [...MOCK_CALLS].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  const upcoming = calls.filter((c) => c.status === "scheduled");

  return (
    <div style={{ padding: "32px clamp(20px, 3vw, 40px)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            CRM · Calls
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "6px 0 0" }}>
            Насрочени разговори
          </h1>
          <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
            {calls.length} общо · {upcoming.length} предстоящи
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary">Връзка с Google Calendar</button>
          <button className="btn-primary">Booking page настройки</button>
        </div>
      </header>

      <KPIRow calls={calls} />

      <div className="card" style={{ marginTop: 24, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--hairline)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Списък</span>
          <input className="input" type="search" placeholder="Търси по име, имейл…" style={{ maxWidth: 320 }} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Кога</th>
                <th>Гост</th>
                <th>Контакти</th>
                <th>Хост</th>
                <th>Meeting</th>
                <th>Статус</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <CallRow key={c.id} call={c} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPIRow({ calls }: { calls: Call[] }) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayCount = calls.filter((c) => c.startAt.slice(0, 10) === todayKey).length;
  const scheduled = calls.filter((c) => c.status === "scheduled").length;
  const completed = calls.filter((c) => c.status === "completed").length;
  const noShow = calls.filter((c) => c.status === "no_show").length;
  const buckets = [
    { label: "Общо", value: calls.length },
    { label: "Днес", value: todayCount },
    { label: "Предстоящи", value: scheduled },
    { label: "Проведени", value: completed },
    { label: "No-show", value: noShow },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
      {buckets.map((b) => (
        <div key={b.label} className="card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            {b.label}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, letterSpacing: "-0.02em" }}>
            {b.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function CallRow({ call }: { call: Call }) {
  const c = CALL_STATUS_COLOR[call.status];
  return (
    <tr>
      <td>
        <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{formatDateTime(call.startAt)}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          {relativeTime(call.startAt)} · {call.durationMin} мин
        </div>
      </td>
      <td>
        <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{call.leadName}</div>
        {call.notes && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{call.notes}</div>
        )}
      </td>
      <td>
        <div>
          <a href={`mailto:${call.email}`} style={{ color: "var(--text-secondary)" }}>{call.email}</a>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{call.phone}</div>
      </td>
      <td>{call.hostName}</td>
      <td>
        <a
          href={call.meetingUrl}
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
          Meet
        </a>
      </td>
      <td>
        <span className="badge" style={{ color: c.fg, background: c.bg, borderColor: c.bd }}>
          {CALL_STATUS_LABEL[call.status]}
        </span>
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
