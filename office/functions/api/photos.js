import { isOfficeUser } from "../_shared/access.js";

const ALLOWED_EMAIL = "dhruvagnihotri21@gmail.com";
const MAX_PHOTO_BYTES = 350000;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

function toBase64(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

export async function onRequestPost({ request, env }) {
  if (!await isOfficeUser(request)) return json({ error: "Sign in with the approved office account." }, 401);
  if (!env.DB) return json({ error: "Office database is not connected." }, 503);
  try {
    const form = await request.formData();
    const file = form.get("photo");
    const reportId = String(form.get("reportId") || "");
    if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type) || file.size < 1 || file.size > MAX_PHOTO_BYTES) {
      return json({ error: "Use a JPEG, PNG, or WebP photo under 350 KB." }, 400);
    }
    if (!/^[A-Za-z0-9._-]{1,80}$/.test(reportId)) return json({ error: "The report reference is not valid." }, 400);
    const id = crypto.randomUUID();
    const encoded = toBase64(new Uint8Array(await file.arrayBuffer()));
    await env.DB.prepare(
      "INSERT INTO office_photos (id, user_email, report_id, mime_type, image_base64, byte_length) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, ALLOWED_EMAIL, reportId, file.type, encoded, file.size).run();
    return json({ id, reportId, url: "/api/photos?id=" + encodeURIComponent(id) });
  } catch (_) {
    return json({ error: "The photo could not be saved. Please try a smaller image." }, 503);
  }
}

export async function onRequestGet({ request, env }) {
  if (!await isOfficeUser(request)) return json({ error: "Sign in with the approved office account." }, 401);
  if (!env.DB) return json({ error: "Office database is not connected." }, 503);
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "The photo was not found." }, 404);
  try {
    const row = await env.DB.prepare(
      "SELECT mime_type, image_base64 FROM office_photos WHERE id = ? AND user_email = ?"
    ).bind(id, ALLOWED_EMAIL).first();
    if (!row) return json({ error: "The photo was not found." }, 404);
    const binary = Uint8Array.from(atob(row.image_base64), character => character.charCodeAt(0));
    return new Response(binary, {
      headers: {
        "Content-Type": row.mime_type,
        "Content-Length": String(binary.byteLength),
        "Cache-Control": "private, max-age=3600, immutable",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (_) {
    return json({ error: "The photo could not be loaded." }, 503);
  }
}

