import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/users-store";
import {
  ensureBookingProfile,
  getAvailabilityForUser,
  type AvailabilitySlot,
} from "@/lib/booking-store";
import { SetupClient } from "./setup-client";

export const dynamic = "force-dynamic";

export default async function CallsSetupPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const profile = await ensureBookingProfile(me.id, me.email);
  const availability = await getAvailabilityForUser(me.id);

  // Default availability if user has none yet — Mon-Fri 09:00-18:00
  const seeded: AvailabilitySlot[] =
    availability.length > 0
      ? availability
      : [1, 2, 3, 4, 5].map((wd) => ({
          id: `seed-${wd}`,
          userId: me.id,
          weekday: wd,
          startMinute: 9 * 60,
          endMinute: 18 * 60,
        }));

  return (
    <div style={{ padding: "32px clamp(20px, 3vw, 40px)", maxWidth: 980, marginLeft: "auto", marginRight: "auto" }}>
      <header style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          CRM · Booking setup
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "6px 0 0" }}>
          Календар за разговори
        </h1>
        <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: 14, maxWidth: 720 }}>
          Настрой публичната си booking страница. Хората ще резервират часове през линк като <code style={{ color: "var(--text-primary)" }}>live.aibrandscale.io/book/{profile.handle}</code>.
        </p>
      </header>
      <SetupClient profile={profile} initialAvailability={seeded} />
    </div>
  );
}
