import { isOfficeUser } from "../_shared/access.js";

const ALLOWED_EMAIL = "dhruvagnihotri21@gmail.com";
const SECTIONS = new Set(["workspace", "operations", "business"]);
const MAX_PAYLOAD_BYTES = 850000;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
}

export async function onRequestGet({ request, env }) {
  if (!await isOfficeUser(request)) return json({ error: "Sign in with the approved office account." }, 401);
  if (!env.DB) return json({ error: "Office database is not connected." }, 503);
  try {
    const result = await env.DB.prepare(
      "SELECT section, payload, version, updated_at FROM office_state WHERE user_email = ?"
    ).bind(ALLOWED_EMAIL).all();
    const sections = {};
    for (const row of result.results || []) {
      try {
        sections[row.section] = { data: JSON.parse(row.payload), version: row.version, updatedAt: row.updated_at };
      } catch (_) {
        return json({ error: "A saved workspace section could not be read." }, 500);
      }
    }
    return json({ sections });
  } catch (_) {
    return json({ error: "Could not load the shared workspace." }, 503);
  }
}

export async function onRequestPut({ request, env }) {
  if (!await isOfficeUser(request)) return json({ error: "Sign in with the approved office account." }, 401);
  if (!env.DB) return json({ error: "Office database is not connected." }, 503);
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > MAX_PAYLOAD_BYTES) return json({ error: "This section is too large to sync." }, 413);
  try {
    const body = await request.json();
    if (!SECTIONS.has(body.section) || !body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
      return json({ error: "The workspace section is not valid." }, 400);
    }
    const payload = JSON.stringify(body.data);
    if (new TextEncoder().encode(payload).byteLength > MAX_PAYLOAD_BYTES) {
      return json({ error: "This section is too large to sync." }, 413);
    }
    await env.DB.prepare(
      "INSERT INTO office_state (user_email, section, payload, version) VALUES (?, ?, ?, 1) " +
      "ON CONFLICT(user_email, section) DO UPDATE SET payload = excluded.payload, version = office_state.version + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')"
    ).bind(ALLOWED_EMAIL, body.section, payload).run();
    const saved = await env.DB.prepare(
      "SELECT version, updated_at FROM office_state WHERE user_email = ? AND section = ?"
    ).bind(ALLOWED_EMAIL, body.section).first();
    return json({ section: body.section, version: saved.version, updatedAt: saved.updated_at });
  } catch (_) {
    return json({ error: "Could not save the shared workspace. Your local copy is kept." }, 503);
  }
}

