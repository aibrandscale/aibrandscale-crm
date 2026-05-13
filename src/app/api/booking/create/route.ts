import { NextResponse } from "next/server";
import {
  getBookingProfileByHandle,
  getAvailabilityForUser,
  getHostBookings,
  createBooking,
} from "@/lib/booking-store";
import { computeSlotsForDate } from "@/lib/slots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const data = body as {
    handle?: string;
    startAt?: string;
    endAt?: string;
    name?: string;
    email?: string;
    phone?: string;
    note?: string;
    timezone?: string;
  };

  const handle = (data.handle ?? "").trim().toLowerCase();
  if (!handle) return NextResponse.json({ error: "handle missing" }, { status: 422 });
  const profile = await getBookingProfileByHandle(handle);
  if (!profile) return NextResponse.json({ error: "Профилът не съществува." }, { status: 404 });

  const name = (data.name ?? "").trim();
  const email = (data.email ?? "").trim();
  if (name.length < 2) return NextResponse.json({ error: "Невалидно име." }, { status: 422 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ error: "Невалиден имейл." }, { status: 422 });

  const startAt = new Date(data.startAt ?? "");
  const endAt = new Date(data.endAt ?? "");
  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime()) || endAt <= startAt) {
    return NextResponse.json({ error: "Невалиден слот." }, { status: 422 });
  }

  // Re-validate slot against current availability + bookings (defense in depth)
  const [availability, existing] = await Promise.all([
    getAvailabilityForUser(profile.userId),
    getHostBookings(profile.userId),
  ]);
  const dateInTz = new Intl.DateTimeFormat("en-CA", { timeZone: profile.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(startAt);
  const slots = computeSlotsForDate({ profile, availability, bookings: existing, date: dateInTz });
  const isValid = slots.some((s) => s.startAt === startAt.toISOString());
  if (!isValid) {
    return NextResponse.json({ error: "Този слот вече не е свободен." }, { status: 409 });
  }

  // Placeholder meeting URL until Google Calendar OAuth is wired up.
  const meetingUrl = `https://meet.google.com/lookup/${Math.random().toString(36).slice(2, 10)}`;

  try {
    const booking = await createBooking({
      hostId: profile.userId,
      guestName: name,
      guestEmail: email,
      guestPhone: data.phone?.trim() || undefined,
      guestNote: data.note?.trim() || undefined,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      durationMin: profile.defaultDurationMin,
      timezone: (data.timezone ?? profile.timezone).trim(),
      meetingUrl,
    });
    return NextResponse.json({ ok: true, id: booking.id, meetingUrl: booking.meetingUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Грешка." },
      { status: 422 },
    );
  }
}
