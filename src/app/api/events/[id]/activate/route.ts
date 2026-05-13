import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setActiveEvent } from "@/lib/events-store";

async function getSession() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не си логнат." }, { status: 401 });
  const { id } = await ctx.params;
  const ev = await setActiveEvent(id);
  if (!ev) return NextResponse.json({ error: "Не намерен." }, { status: 404 });
  return NextResponse.json({ ok: true, event: ev });
}
