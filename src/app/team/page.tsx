import { getAllProfiles } from "@/lib/users-store";
import { InviteCard } from "./invite-card";
import { formatDate, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const users = await getAllProfiles();
  return (
    <div style={{ padding: "32px clamp(20px, 3vw, 40px)" }}>
      <header style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          CRM · Team
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "6px 0 0" }}>
          Екип
        </h1>
        <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
          Покани нови потребители — системата сама генерира парола и я изпраща на имейла.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <InviteCard />

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Потребители</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{users.length} общо</span>
          </div>
          {users.length === 0 ? (
            <div style={{ padding: 28, color: "var(--text-muted)", textAlign: "center", fontSize: 13 }}>
              Все още няма потребители.
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {users.map((u, i) => {
                const initials = u.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("");
                return (
                  <li
                    key={u.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 18px",
                      borderTop: i === 0 ? "none" : "1px solid var(--hairline-soft)",
                    }}
                  >
                    <span
                      style={{
                        width: 34,
                        height: 34,
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
                      {initials || "U"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-muted)" }}>
                      <div>{relativeTime(u.createdAt)}</div>
                      <div style={{ marginTop: 2 }}>{formatDate(u.createdAt)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
