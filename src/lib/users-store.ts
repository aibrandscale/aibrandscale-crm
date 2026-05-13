import { createSupabaseAdminClient } from "./supabase/admin";
import { createSupabaseServerClient } from "./supabase/server";

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member";
  createdAt: string;
};

type DbProfile = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member";
  created_at: string;
};

function map(db: DbProfile): Profile {
  return {
    id: db.id,
    email: db.email,
    name: db.name,
    role: db.role,
    createdAt: db.created_at,
  };
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,name,role,created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[users-store] getAllProfiles error", error);
    return [];
  }
  return (data as DbProfile[] | null)?.map(map) ?? [];
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id,email,name,role,created_at")
    .eq("id", user.id)
    .maybeSingle();
  return data ? map(data as DbProfile) : null;
}
