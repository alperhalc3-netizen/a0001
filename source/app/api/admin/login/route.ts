import { isAuthorized, unauthorized } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  return Response.json({ ok: true });
}
