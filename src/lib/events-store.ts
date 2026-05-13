import { createSupabaseAdminClient } from "./supabase/admin";

export type EventStatus = "draft" | "upcoming" | "live" | "past";

export type Event = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  date: string;
  status: EventStatus;
  isActive: boolean;
  createdAt: string;
};

type DbEvent = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  date: string;
  status: EventStatus;
  is_active: boolean;
  created_at: string;
};

function map(db: DbEvent): Event {
  return {
    id: db.id,
    slug: db.slug,
    name: db.name,
    description: db.description ?? undefined,
    date: db.date,
    status: db.status,
    isActive: db.is_active,
    createdAt: db.created_at,
  };
}

export async function getAllEvents(): Promise<Event[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("id,slug,name,description,date,status,is_active,created_at")
    .order("date", { ascending: false });
  if (error) {
    console.error("[events-store] getAllEvents error", error);
    return [];
  }
  return (data as DbEvent[] | null)?.map(map) ?? [];
}

export async function findEventBySlug(slug: string): Promise<Event | undefined> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("events")
    .select("id,slug,name,description,date,status,is_active,created_at")
    .eq("slug", slug.trim().toLowerCase())
    .maybeSingle();
  return data ? map(data as DbEvent) : undefined;
}

export async function findEventById(id: string): Promise<Event | undefined> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("events")
    .select("id,slug,name,description,date,status,is_active,created_at")
    .eq("id", id)
    .maybeSingle();
  return data ? map(data as DbEvent) : undefined;
}

export async function getActiveEvent(): Promise<Event | undefined> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("events")
    .select("id,slug,name,description,date,status,is_active,created_at")
    .eq("is_active", true)
    .maybeSingle();
  return data ? map(data as DbEvent) : undefined;
}

export async function createEvent(input: {
  name: string;
  slug: string;
  date: string;
  description?: string;
  status?: EventStatus;
}): Promise<Event> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      description: input.description?.trim() || null,
      date: input.date,
      status: input.status ?? "upcoming",
      is_active: false,
    })
    .select("id,slug,name,description,date,status,is_active,created_at")
    .single();
  if (error || !data) {
    if (error?.code === "23505") throw new Error("Вече има event с този slug.");
    throw new Error(error?.message ?? "Грешка при създаване.");
  }
  return map(data as DbEvent);
}

export async function setActiveEvent(id: string): Promise<Event | null> {
  const supabase = createSupabaseAdminClient();
  // The DB trigger flips all others to is_active=false when we set one to true.
  const { data, error } = await supabase
    .from("events")
    .update({ is_active: true })
    .eq("id", id)
    .select("id,slug,name,description,date,status,is_active,created_at")
    .maybeSingle();
  if (error) {
    console.error("[events-store] setActiveEvent error", error);
    return null;
  }
  return data ? map(data as DbEvent) : null;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    console.error("[events-store] deleteEvent error", error);
    return false;
  }
  // If no event is active anymore, mark the most recent one active.
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();
  if (!data) {
    const { data: latest } = await supabase
      .from("events")
      .select("id")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest) await setActiveEvent((latest as { id: string }).id);
  }
  return true;
}
