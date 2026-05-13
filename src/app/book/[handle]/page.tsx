import { notFound } from "next/navigation";
import { getBookingProfileByHandle, getAvailabilityForUser, getHostBookings } from "@/lib/booking-store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BookClient } from "./book-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ handle: string }>;

export default async function BookPage({ params }: { params: Params }) {
  const { handle } = await params;
  const profile = await getBookingProfileByHandle(handle);
  if (!profile) notFound();

  // Look up host's display name for the page header
  const sb = createSupabaseAdminClient();
  const { data: hostRow } = await sb
    .from("profiles")
    .select("name,email")
    .eq("id", profile.userId)
    .maybeSingle();
  const host = hostRow as { name: string; email: string } | null;

  const [availability, bookings] = await Promise.all([
    getAvailabilityForUser(profile.userId),
    getHostBookings(profile.userId),
  ]);

  return (
    <BookClient
      profile={profile}
      hostName={host?.name ?? profile.handle}
      availability={availability}
      bookings={bookings.map((b) => ({ startAt: b.startAt, endAt: b.endAt, status: b.status }))}
    />
  );
}
