import { clerkMiddleware, clerkClient, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/api/webhooks(.*)", "/sign-up(.*)", "/sign-in(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  // Allow public routes for unauthenticated users
  if (!userId && !isPublicRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Handle authenticated users
  if (userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const role = user.publicMetadata.role as string | undefined;

      // Admin accessing regular dashboard
      if (role === "admin" && pathname === "/dashboard") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }

      // Non-admin trying to access admin routes
      if (role !== "admin" && pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Redirect from auth pages if already logged in
      if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
        return NextResponse.redirect(
          new URL(role === "admin" ? "/admin/dashboard" : "/dashboard", req.url)
        );
      }
    } catch (error) {
      console.error("Error fetching user data from Clerk:", error);
      return NextResponse.redirect(new URL("/error", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
