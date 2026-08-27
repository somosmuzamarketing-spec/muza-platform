export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/rooms/:path*",
    "/video/:path*",
    "/celebremos/:path*",
    "/colaboracion/:path*",
    "/oportunidades/:path*",
  ],
};
