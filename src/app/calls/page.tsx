import Link from "next/link";
import { listAllBookings, type Booking } from "@/lib/booking-store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<Booking["status"], string> = {
  confirmed: "Запазен",
  completed: "Проведен",
  no_show: "Не дошъл",
  cancelled: "Отказан",
};
const STATUS_COLOR: Record<Booking["status"], { fg: string; bg: string; bd: string }> = {
  confirmed: { fg: "#60A5FA", bg: "rgba(96,165,250,0.10)", bd: "rgba(96,165,250,0.25)" },
  completed: { fg: "#4ADE80", bg: "rgba(74,222,128,0.10)", bd: "rgba(74,222,128,0.25)" },
  no_show: { fg: "#FACC15", bg: "rgba(250,204,21,0.10)", bd: "rgba(250,204,21,0.25)" },
  cancelled: { fg: "#EF4444", bg: "rgba(239,68,68,0.10)", bd: "rgba(239,68,68,0.25)" },
};

export default async function CallsPage() {
  const bookings = await listAllBookings();
  const hostIds = [...new Set(bookings.map((b) => b.hostId))];
  let hosts: Record<string, string> = {};
  if (hostIds.length) {
    const sb = createSupabaseAdminClient();
    const { data } = await sb.from("profiles").select("id,name").in("id", hostIds);
    hosts = Object.fromEntries(((data as { id: string; name: string }[] | null) ?? []).map((p) => [p.id, p.name]));
  }

  const now = Date.now();
  const upcoming = bookings.filter((b) => b.status === "confirmed" && new Date(b.startAt).getTime() > now);
  const todayKey = new Date().toISOString().slice(0, 10);
  const callsToday = bookings.filter((b) => b.startAt.slice(0, 10) === todayKey).length;
  const completed = bookings.filter((b) => b.status === "completed").length;
  const noShow = bookings.filter((b) => b.status === "no_show").length;

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
            {bookings.length} общо · {upcoming.length} предстоящи
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/calls/setup" className="btn-secondary" style={{ textDecoration: "none" }}>Настройки на календара</Link>
        </div>
      </header>

      <KPIRow data={{ total: bookings.length, today: callsToday, upcoming: upcoming.length, completed, noShow }} />

      <div className="card" style={{ marginTop: 24, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--hairline)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Списък</span>
        </div>
        {bookings.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 13, marginBottom: 10 }}>Все още няма запазени разговори.</div>
            <Link href="/calls/setup" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
              Настрой booking страницата →
            </Link>
          </div>
        ) : (
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
                </tr>
              </thead>
              <tbody>
                {bookings.map((c) => {
                  const cc = STATUS_COLOR[c.status];
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{formatDateTime(c.startAt)}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{relativeTime(c.startAt)} · {c.durationMin} мин</div>
                      </td>
                      <td>
                        <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{c.guestName}</div>
                        {c.guestNote && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{c.guestNote}</div>}
                      </td>
                      <td>
                        <div><a href={`mailto:${c.guestEmail}`} style={{ color: "var(--text-secondary)" }}>{c.guestEmail}</a></div>
                        {c.guestPhone && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{c.guestPhone}</div>}
                      </td>
                      <td>{hosts[c.hostId] ?? "—"}</td>
                      <td>
                        {c.meetingUrl ? (
                          <a href={c.meetingUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", padding: "4px 10px", border: "1px solid var(--hairline)", borderRadius: 8, fontSize: 12, background: "var(--surface-card)" }}>
                            Meet
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className="badge" style={{ color: cc.fg, background: cc.bg, borderColor: cc.bd }}>{STATUS_LABEL[c.status]}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KPIRow({ data }: { data: { total: number; today: number; upcoming: number; completed: number; noShow: number } }) {
  const buckets = [
    { label: "Общо", value: data.total },
    { label: "Днес", value: data.today },
    { label: "Предстоящи", value: data.upcoming },
    { label: "Проведени", value: data.completed },
    { label: "No-show", value: data.noShow },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
      {buckets.map((b) => (
        <div key={b.label} className="card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>{b.label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, letterSpacing: "-0.02em" }}>{b.value}</div>
        </div>
      ))}
    </div>
  );
}
