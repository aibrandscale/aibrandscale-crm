import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "./_components/sidebar";
import { getCurrentProfile } from "@/lib/users-store";

export const metadata: Metadata = {
  title: "AI Brand Scale — CRM",
  description: "Sales CRM за aibrandscale: leads и насрочени разговори.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // getCurrentProfile reads cookies + Supabase. If env is missing (e.g. during a
  // pre-render build with no envs available), fall back to no user.
  let user: Awaited<ReturnType<typeof getCurrentProfile>> = null;
  try {
    user = await getCurrentProfile();
  } catch {
    user = null;
  }
  return (
    <html lang="bg">
      <body>
        {user ? (
          <div style={{ minHeight: "100vh", display: "flex" }}>
            <Sidebar user={{ name: user.name, email: user.email }} />
            <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
          </div>
        ) : (
          <main style={{ minHeight: "100vh" }}>{children}</main>
        )}
      </body>
    </html>
  );
}
