import { NextResponse } from "next/server";
import { appendLead } from "@/lib/leads-store";
import { findEventBySlug, getActiveEvent } from "@/lib/events-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Secret",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const expected = process.env.WEBHOOK_SECRET;
  if (expected) {
    const given = req.headers.get("x-webhook-secret");
    if (given !== expected) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401, headers: corsHeaders(origin) });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders(origin) });
  }

  const data = body as {
    name?: string;
    email?: string;
    phone?: string;
    source?: string;
    note?: string;
    eventSlug?: string;
    eventId?: string;
  };

  const name = (data.name ?? "").toString().trim();
  const email = (data.email ?? "").toString().trim();
  const phone = (data.phone ?? "").toString().trim();
  if (!name || !email || !phone) {
    return NextResponse.json(
      { error: "name, email, phone are required" },
      { status: 422, headers: corsHeaders(origin) },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 422, headers: corsHeaders(origin) });
  }

  // Resolve which event the lead belongs to:
  // 1) explicit eventSlug → 2) active event → 3) nothing (lead floats unattached)
  let event = data.eventSlug ? await findEventBySlug(data.eventSlug.toString().trim()) : undefined;
  if (!event && data.eventId) {
    const all = await import("@/lib/events-store");
    event = (await all.getAllEvents()).find((e) => e.id === data.eventId);
  }
  if (!event) event = await getActiveEvent();

  const lead = await appendLead({
    name,
    email,
    phone,
    source: data.source?.toString().trim() || "Landing — AI Challenge",
    note: data.note?.toString().trim() || undefined,
    eventId: event?.id,
    eventSlug: event?.slug,
  });

  return NextResponse.json(
    { ok: true, id: lead.id, event: event ? { id: event.id, slug: event.slug, name: event.name } : null },
    { status: 201, headers: corsHeaders(origin) },
  );
}
