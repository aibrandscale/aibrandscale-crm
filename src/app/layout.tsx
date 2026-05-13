import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "./_components/sidebar";
import { getCurrentProfile } from "@/lib/users-store";

export const metadata: Metadata = {
  title: "AI Brand Scale — CRM",
  description: "Sales CRM за aibrandscale: leads и насрочени разговори.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentProfile();
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
