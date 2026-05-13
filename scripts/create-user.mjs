#!/usr/bin/env node
/**
 * Bootstrap an initial admin user via the Supabase service-role key.
 *
 * Usage:
 *   node scripts/create-user.mjs <email> <password> "<full name>"
 */
import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
import { createClient } from "@supabase/supabase-js";

const [, , email, password, ...nameParts] = process.argv;
const name = nameParts.join(" ").trim();

if (!email || !password || !name) {
  console.error('Usage: node scripts/create-user.mjs <email> <password> "<full name>"');
  process.exit(1);
}
if (password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name },
});

if (error) {
  console.error("✗", error.message);
  process.exit(1);
}

console.log(`✓ Created Supabase user ${email} (${data.user.id}).`);
console.log("   Profile row will be auto-created by the DB trigger.");
