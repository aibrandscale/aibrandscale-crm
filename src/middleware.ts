import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = new Set(["/login", "/auth/callback"]);
const PUBLIC_PATH_PREFIXES = ["/book/"];
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/webhooks/", "/api/booking/create"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass-through for public routes (still refresh the session so cookies stay fresh).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request: req });

  // If supabase isn't configured yet, redirect everything except /login to /login
  // so the app doesn't crash during initial setup.
  if (!url || !anon) {
    if (
      PUBLIC_PATHS.has(pathname) ||
      PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p)) ||
      PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))
    ) {
      return response;
    }
    const redirect = req.nextUrl.clone();
    redirect.pathname = "/login";
    return NextResponse.redirect(redirect);
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(toSet) {
        for (const { name, value } of toSet) req.cookies.set(name, value);
        response = NextResponse.next({ request: req });
        for (const { name, value, options } of toSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refresh session if expired — putting it on every middleware run keeps it warm.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p)) ||
    PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return response;
  }

  if (!user) {
    const redirect = req.nextUrl.clone();
    redirect.pathname = "/login";
    if (pathname !== "/") redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|webmanifest)).*)",
  ],
};
