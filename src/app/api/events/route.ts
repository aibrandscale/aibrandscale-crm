import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createEvent, getAllEvents, setActiveEvent } from "@/lib/events-store";

async function getSession() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const events = await getAllEvents();
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не си логнат." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { name, slug, date, description, status, setActive } = body as {
    name?: string;
    slug?: string;
    date?: string;
    description?: string;
    status?: "draft" | "upcoming" | "live" | "past";
    setActive?: boolean;
  };

  if (!name?.trim()) return NextResponse.json({ error: "Името е задължително." }, { status: 422 });
  if (!slug?.trim()) return NextResponse.json({ error: "Slug-ът е задължителен." }, { status: 422 });
  if (!date) return NextResponse.json({ error: "Дата е задължителна." }, { status: 422 });

  try {
    const ev = await createEvent({ name, slug, date, description, status });
    if (setActive) await setActiveEvent(ev.id);
    return NextResponse.json({ ok: true, event: ev }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Грешка." },
      { status: 422 },
    );
  }
}
