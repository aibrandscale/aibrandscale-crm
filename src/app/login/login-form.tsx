"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setError(error.message === "Invalid login credentials" ? "Невалиден имейл или парола." : error.message);
      setLoading(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Имейл" type="email" value={email} onChange={setEmail} autoComplete="email" required autoFocus />
      <Field label="Парола" type="password" value={password} onChange={setPassword} autoComplete="current-password" required />
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
        {loading ? "Влизаме…" : "Вход"}
      </button>
      <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
        Нямаш профил? Свържи се с администратор.
      </p>
    </form>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  required,
  autoComplete,
  autoFocus,
}: {
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className="input"
      />
    </label>
  );
}
