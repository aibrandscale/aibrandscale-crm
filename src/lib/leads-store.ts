import { createSupabaseAdminClient } from "./supabase/admin";
import type { Lead, LeadStatus } from "./mock-data";

type DbLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  note: string | null;
  event_id: string | null;
  created_at: string;
};

type DbEvent = { id: string; slug: string };

function mapLead(db: DbLead, eventSlug: string | null): Lead {
  return {
    id: db.id,
    name: db.name,
    email: db.email,
    phone: db.phone,
    source: db.source,
    status: db.status,
    note: db.note ?? undefined,
    eventId: db.event_id ?? undefined,
    eventSlug: eventSlug ?? undefined,
    createdAt: db.created_at,
  };
}

export async function getAllLeads(): Promise<Lead[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id,name,email,phone,source,status,note,event_id,created_at, event:events(slug)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[leads-store] getAllLeads error", error);
    return [];
  }
  type Joined = DbLead & { event: { slug: string } | { slug: string }[] | null };
  return ((data as Joined[] | null) ?? []).map((row) => {
    const ev = Array.isArray(row.event) ? row.event[0] : row.event;
    return mapLead(row, ev?.slug ?? null);
  });
}

export async function appendLead(input: {
  name: string;
  email: string;
  phone: string;
  source?: string;
  note?: string;
  status?: LeadStatus;
  eventId?: string;
  eventSlug?: string;
}): Promise<Lead> {
  const supabase = createSupabaseAdminClient();

  // Resolve event_id from either id or slug.
  let eventId = input.eventId ?? null;
  let eventSlug: string | null = null;
  if (eventId) {
    const { data } = await supabase.from("events").select("id,slug").eq("id", eventId).maybeSingle();
    eventSlug = (data as DbEvent | null)?.slug ?? null;
  } else if (input.eventSlug) {
    const { data } = await supabase.from("events").select("id,slug").eq("slug", input.eventSlug.toLowerCase()).maybeSingle();
    eventId = (data as DbEvent | null)?.id ?? null;
    eventSlug = (data as DbEvent | null)?.slug ?? null;
  }
  if (!eventId) {
    const { data } = await supabase.from("events").select("id,slug").eq("is_active", true).maybeSingle();
    eventId = (data as DbEvent | null)?.id ?? null;
    eventSlug = (data as DbEvent | null)?.slug ?? null;
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone,
      source: input.source ?? "Webhook",
      status: input.status ?? "new",
      note: input.note ?? null,
      event_id: eventId,
    })
    .select("id,name,email,phone,source,status,note,event_id,created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to insert lead");
  }
  return mapLead(data as DbLead, eventSlug);
}
