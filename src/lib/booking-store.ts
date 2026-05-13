import { createSupabaseAdminClient } from "./supabase/admin";

export type BookingProfile = {
  userId: string;
  handle: string;
  title: string;
  description: string | null;
  defaultDurationMin: number;
  timezone: string;
  minNoticeMin: number;
  maxAdvanceDays: number;
  bufferMin: number;
};

export type AvailabilitySlot = {
  id: string;
  userId: string;
  weekday: number; // 0=Sun..6=Sat
  startMinute: number;
  endMinute: number;
};

export type Booking = {
  id: string;
  hostId: string;
  leadId: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  guestNote: string | null;
  startAt: string;
  endAt: string;
  durationMin: number;
  timezone: string;
  meetingUrl: string | null;
  googleEventId: string | null;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  createdAt: string;
};

type DbProfile = {
  user_id: string;
  handle: string;
  title: string;
  description: string | null;
  default_duration_min: number;
  timezone: string;
  min_notice_min: number;
  max_advance_days: number;
  buffer_min: number;
};

type DbAvail = {
  id: string;
  user_id: string;
  weekday: number;
  start_minute: number;
  end_minute: number;
};

type DbBooking = {
  id: string;
  host_id: string;
  lead_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  guest_note: string | null;
  start_at: string;
  end_at: string;
  duration_min: number;
  timezone: string;
  meeting_url: string | null;
  google_event_id: string | null;
  status: Booking["status"];
  created_at: string;
};

function mapProfile(db: DbProfile): BookingProfile {
  return {
    userId: db.user_id,
    handle: db.handle,
    title: db.title,
    description: db.description,
    defaultDurationMin: db.default_duration_min,
    timezone: db.timezone,
    minNoticeMin: db.min_notice_min,
    maxAdvanceDays: db.max_advance_days,
    bufferMin: db.buffer_min,
  };
}

function mapAvail(db: DbAvail): AvailabilitySlot {
  return {
    id: db.id,
    userId: db.user_id,
    weekday: db.weekday,
    startMinute: db.start_minute,
    endMinute: db.end_minute,
  };
}

function mapBooking(db: DbBooking): Booking {
  return {
    id: db.id,
    hostId: db.host_id,
    leadId: db.lead_id,
    guestName: db.guest_name,
    guestEmail: db.guest_email,
    guestPhone: db.guest_phone,
    guestNote: db.guest_note,
    startAt: db.start_at,
    endAt: db.end_at,
    durationMin: db.duration_min,
    timezone: db.timezone,
    meetingUrl: db.meeting_url,
    googleEventId: db.google_event_id,
    status: db.status,
    createdAt: db.created_at,
  };
}

function suggestHandle(email: string) {
  const base = email.split("@")[0]?.toLowerCase() ?? "user";
  return base.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "user";
}

export async function getBookingProfileByUser(userId: string): Promise<BookingProfile | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("booking_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? mapProfile(data as DbProfile) : null;
}

export async function getBookingProfileByHandle(handle: string): Promise<BookingProfile | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("booking_profiles")
    .select("*")
    .eq("handle", handle.trim().toLowerCase())
    .maybeSingle();
  return data ? mapProfile(data as DbProfile) : null;
}

export async function ensureBookingProfile(
  userId: string,
  fallbackEmail: string,
): Promise<BookingProfile> {
  const existing = await getBookingProfileByUser(userId);
  if (existing) return existing;
  const sb = createSupabaseAdminClient();
  const handleSeed = suggestHandle(fallbackEmail);
  let handle = handleSeed;
  let attempt = 0;
  while (attempt < 5) {
    const { data, error } = await sb
      .from("booking_profiles")
      .insert({ user_id: userId, handle, title: "Запази си час" })
      .select("*")
      .single();
    if (!error && data) return mapProfile(data as DbProfile);
    if (error?.code === "23505") {
      attempt += 1;
      handle = `${handleSeed}-${attempt + 1}`;
      continue;
    }
    throw new Error(error?.message ?? "Could not create booking profile");
  }
  throw new Error("Не може да се намери уникален handle.");
}

export async function updateBookingProfile(
  userId: string,
  patch: Partial<Omit<BookingProfile, "userId">>,
): Promise<BookingProfile> {
  const sb = createSupabaseAdminClient();
  const payload: Record<string, unknown> = {};
  if (patch.handle !== undefined) payload.handle = patch.handle.trim().toLowerCase();
  if (patch.title !== undefined) payload.title = patch.title.trim();
  if (patch.description !== undefined) payload.description = patch.description?.trim() || null;
  if (patch.defaultDurationMin !== undefined) payload.default_duration_min = patch.defaultDurationMin;
  if (patch.timezone !== undefined) payload.timezone = patch.timezone;
  if (patch.minNoticeMin !== undefined) payload.min_notice_min = patch.minNoticeMin;
  if (patch.maxAdvanceDays !== undefined) payload.max_advance_days = patch.maxAdvanceDays;
  if (patch.bufferMin !== undefined) payload.buffer_min = patch.bufferMin;
  const { data, error } = await sb
    .from("booking_profiles")
    .update(payload)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error || !data) {
    if (error?.code === "23505") throw new Error("Този handle вече се ползва от друг потребител.");
    throw new Error(error?.message ?? "Грешка при запис.");
  }
  return mapProfile(data as DbProfile);
}

export async function getAvailabilityForUser(userId: string): Promise<AvailabilitySlot[]> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("booking_availability")
    .select("*")
    .eq("user_id", userId)
    .order("weekday")
    .order("start_minute");
  return (data ?? []).map((row) => mapAvail(row as DbAvail));
}

export async function replaceAvailability(
  userId: string,
  slots: { weekday: number; startMinute: number; endMinute: number }[],
): Promise<AvailabilitySlot[]> {
  const sb = createSupabaseAdminClient();
  await sb.from("booking_availability").delete().eq("user_id", userId);
  if (slots.length === 0) return [];
  const { data, error } = await sb
    .from("booking_availability")
    .insert(
      slots.map((s) => ({
        user_id: userId,
        weekday: s.weekday,
        start_minute: s.startMinute,
        end_minute: s.endMinute,
      })),
    )
    .select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapAvail(row as DbAvail));
}

export async function getHostBookings(
  hostId: string,
  range?: { from?: string; to?: string },
): Promise<Booking[]> {
  const sb = createSupabaseAdminClient();
  let q = sb.from("bookings").select("*").eq("host_id", hostId).order("start_at", { ascending: true });
  if (range?.from) q = q.gte("start_at", range.from);
  if (range?.to) q = q.lte("start_at", range.to);
  const { data } = await q;
  return (data ?? []).map((r) => mapBooking(r as DbBooking));
}

export async function listAllBookings(): Promise<Booking[]> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("bookings").select("*").order("start_at", { ascending: true });
  return (data ?? []).map((r) => mapBooking(r as DbBooking));
}

export async function createBooking(input: {
  hostId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestNote?: string;
  startAt: string;
  endAt: string;
  durationMin: number;
  timezone: string;
  meetingUrl?: string | null;
  leadId?: string | null;
  eventId?: string | null;
}): Promise<Booking> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("bookings")
    .insert({
      host_id: input.hostId,
      lead_id: input.leadId ?? null,
      event_id: input.eventId ?? null,
      guest_name: input.guestName,
      guest_email: input.guestEmail,
      guest_phone: input.guestPhone ?? null,
      guest_note: input.guestNote ?? null,
      start_at: input.startAt,
      end_at: input.endAt,
      duration_min: input.durationMin,
      timezone: input.timezone,
      meeting_url: input.meetingUrl ?? null,
      status: "confirmed",
    })
    .select("*")
    .single();
  if (error || !data) {
    if (error?.code === "23P01") throw new Error("Този слот вече е зает.");
    throw new Error(error?.message ?? "Не може да се запази часът.");
  }
  return mapBooking(data as DbBooking);
}

export async function cancelBooking(id: string, reason?: string): Promise<void> {
  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("bookings")
    .update({ status: "cancelled", cancellation_reason: reason ?? null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
