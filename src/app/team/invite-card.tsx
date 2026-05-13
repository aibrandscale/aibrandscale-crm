"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type InviteResult = {
  ok: boolean;
  emailSent?: boolean;
  emailReason?: string;
  password?: string;
  user?: { email: string; name: string };
};

export function InviteCard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Възникна грешка.");
        setLoading(false);
        return;
      }
      setResult(data);
      setEmail("");
      setName("");
      setLoading(false);
      router.refresh();
    } catch {
      setError("Няма връзка със сървъра.");
      setLoading(false);
    }
  }

  async function copyPassword() {
    if (!result?.password) return;
    await navigator.clipboard.writeText(result.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--hairline)" }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Покани нов потребител</span>
      </div>
      <div style={{ padding: 18 }}>
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Имейл" type="email" value={email} onChange={setEmail} placeholder="ime@example.com" required />
          <Field label="Име (по избор)" type="text" value={name} onChange={setName} placeholder="Иван Георгиев" />
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
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: 4, opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}
          >
            {loading ? "Изпращаме…" : "Изпрати покана"}
          </button>
        </form>

        {result && result.user && (
          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 10,
              border: "1px solid rgba(74,222,128,0.25)",
              background: "rgba(74,222,128,0.08)",
              fontSize: 13,
              lineHeight: 1.55,
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--success)", marginBottom: 6 }}>
              ✓ Профилът е създаден за {result.user.email}
            </div>
            {result.emailSent ? (
              <div style={{ color: "var(--text-secondary)" }}>
                Имейлът с паролата е изпратен.
              </div>
            ) : (
              <div style={{ color: "var(--text-secondary)" }}>
                <div style={{ marginBottom: 8 }}>
                  Имейлът <strong>НЕ е изпратен</strong>
                  {result.emailReason ? ` (${result.emailReason})` : ""}. Сподели тази парола ръчно с потребителя:
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <code
                    style={{
                      flex: 1,
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                      fontSize: 14,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--hairline)",
                      color: "var(--text-primary)",
                      userSelect: "all",
                      wordBreak: "break-all",
                    }}
                  >
                    {result.password}
                  </code>
                  <button type="button" onClick={copyPassword} className="btn-secondary" style={{ padding: "8px 12px" }}>
                    {copied ? "Копирано ✓" : "Копирай"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  type: "text" | "email";
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="input"
      />
    </label>
  );
}
