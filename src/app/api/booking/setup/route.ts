import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/users-store";
import {
  ensureBookingProfile,
  updateBookingProfile,
  replaceAvailability,
} from "@/lib/booking-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await getCurrentProfile();
  if (!me) return NextResponse.json({ error: "Не си логнат." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const data = body as {
    handle?: string;
    title?: string;
    description?: string;
    defaultDurationMin?: number;
    timezone?: string;
    minNoticeMin?: number;
    maxAdvanceDays?: number;
    bufferMin?: number;
    availability?: { weekday: number; startMinute: number; endMinute: number }[];
  };

  if (!data.handle || !/^[a-z0-9-]{2,40}$/.test(data.handle)) {
    return NextResponse.json({ error: "Handle: 2-40 символа, само a-z, 0-9 и тире." }, { status: 422 });
  }
  if (!data.title?.trim()) {
    return NextResponse.json({ error: "Заглавието е задължително." }, { status: 422 });
  }

  await ensureBookingProfile(me.id, me.email);
  try {
    await updateBookingProfile(me.id, {
      handle: data.handle,
      title: data.title,
      description: data.description,
      defaultDurationMin: data.defaultDurationMin,
      timezone: data.timezone,
      minNoticeMin: data.minNoticeMin,
      maxAdvanceDays: data.maxAdvanceDays,
      bufferMin: data.bufferMin,
    });
    if (Array.isArray(data.availability)) {
      await replaceAvailability(me.id, data.availability);
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Грешка." },
      { status: 422 },
    );
  }
  return NextResponse.json({ ok: true });
}
