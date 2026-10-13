import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED = ["/account", "/admin"];
const GUEST_ONLY = ["/login", "/register", "/forgot-password"];

const matches = (path: string, bases: string[]) => bases.some((b) => path === b || path.startsWith(`${b}/`));

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  let redirectTo: URL | null = null;
  if (!user && matches(pathname, PROTECTED)) {
    redirectTo = new URL("/login", request.url);
    redirectTo.searchParams.set("next", pathname + search);
  } else if (user && matches(pathname, GUEST_ONLY)) {
    redirectTo = new URL("/account", request.url);
  }

  if (redirectTo) {
    const redirect = NextResponse.redirect(redirectTo);
    // Keep any refreshed session cookies on the redirect response.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
