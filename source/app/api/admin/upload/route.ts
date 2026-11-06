import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { isAuthorized, unauthorized } from "@/lib/admin/auth";
import { slugify } from "@/lib/admin/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const collections = new Set(["works", "tattoo", "shop"]);
const mimeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized();

  const form = await request.formData();
  const file = form.get("file");
  const collection = String(form.get("collection") || "");

  if (!(file instanceof File)) {
    return Response.json({ error: "Missing image file." }, { status: 400 });
  }
  if (!collections.has(collection)) {
    return Response.json({ error: "Invalid collection." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image is larger than 12MB." }, { status: 400 });
  }

  const ext = mimeToExt[file.type];
  if (!ext) {
    return Response.json(
      { error: "Use a JPG, PNG, WEBP or GIF image." },
      { status: 400 },
    );
  }

  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
  const filename = `${base}-${Date.now()}.${ext}`;
  const relative = `/uploads/${collection}/${filename}`;
  const dest = path.join(process.cwd(), "public", "uploads", collection, filename);

  await mkdir(path.dirname(dest), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, buffer);

  return Response.json({
    ok: true,
    image: relative,
    filename,
  });
}
