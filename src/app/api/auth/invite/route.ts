import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generatePassword, sendEmail, inviteEmailHtml } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Require authenticated session
  const sb = await createSupabaseServerClient();
  const {
    data: { user: inviter },
  } = await sb.auth.getUser();
  if (!inviter) {
    return NextResponse.json({ error: "Не си логнат." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { email, name } = body as { email?: string; name?: string };
  const e = (email ?? "").trim();
  const n = (name ?? "").trim() || e.split("@")[0];

  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) {
    return NextResponse.json({ error: "Невалиден имейл адрес." }, { status: 422 });
  }

  const admin = createSupabaseAdminClient();
  const password = generatePassword();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: e,
    password,
    email_confirm: true,
    user_metadata: { name: n },
  });
  if (createErr || !created.user) {
    const msg = createErr?.message ?? "Грешка при създаване.";
    if (msg.includes("already") || msg.includes("registered")) {
      return NextResponse.json({ error: "Този имейл вече има профил." }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  // Profile row is created automatically by DB trigger.

  const inviterName = (inviter.user_metadata?.name as string | undefined) || inviter.email || "AI Brand Scale";
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const loginUrl = `${proto}://${host}/login`;

  const emailRes = await sendEmail({
    to: e,
    subject: "Покана за AI Brand Scale CRM",
    html: inviteEmailHtml({ email: e, password, loginUrl, invitedBy: inviterName }),
    text: `Здрасти,\n\n${inviterName} те покани в AI Brand Scale CRM.\nИмейл: ${e}\nПарола: ${password}\nВлез: ${loginUrl}`,
  });

  return NextResponse.json({
    ok: true,
    user: { id: created.user.id, email: e, name: n },
    emailSent: emailRes.sent,
    emailReason: emailRes.reason,
    password,
  });
}
