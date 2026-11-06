import { timingSafeEqual } from "crypto";
import { DEFAULT_ADMIN_PASSWORD } from "./password";

export { DEFAULT_ADMIN_PASSWORD };

export function adminPassword() {
  return (
    process.env.ADMIN_PASSWORD ||
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
    DEFAULT_ADMIN_PASSWORD
  );
}

export function passwordsMatch(provided: string, expected: string) {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isAuthorized(request: Request) {
  const expected = adminPassword();
  if (!expected) return false;
  const header = request.headers.get("x-admin-password") ?? "";
  return passwordsMatch(header, expected);
}

export function unauthorized() {
  return Response.json(
    { error: "Unauthorized", message: "Wrong password." },
    { status: 401 },
  );
}
