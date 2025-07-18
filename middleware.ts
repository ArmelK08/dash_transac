import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/auth/v2/login",
  "/auth/v2/register",
  "/api/auth/login",
  "/api/auth/register",
];

async function verifyJWT(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return await jwtVerify(token, secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("token")?.value;

  const isPublic = PUBLIC_PATHS.some(
    (path: string) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!token) {
    if (!isPublic) {
      console.log("🚫 Pas de token → /login");
      return NextResponse.redirect(new URL("/auth/v2/login", req.url));
    }
    return NextResponse.next();
  }

  try {
    await verifyJWT(token);

    if (isPublic || pathname === "/") {
      console.log("✅ Déjà connecté → /dashboard/default");
      return NextResponse.redirect(new URL("/dashboard/default", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error("🚫 JWT invalide :", err);

    return NextResponse.redirect(new URL("/auth/v2/login", req.url));
  }
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/auth/v2/login",
    "/auth/v2/register",
    "/dashboard/:path*",
    "/api/protected/:path*",
  ],
};
