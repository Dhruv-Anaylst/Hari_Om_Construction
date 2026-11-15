const ALLOWED_EMAIL = "dhruvagnihotri21@gmail.com";
const ACCESS_ISSUER = "https://rapid-firefly-1046.cloudflareaccess.com";
const ACCESS_AUDIENCE = "d543603de79cc79e26da241428aa5e844038939af05ff2df37e909ad169d6eae";
const ACCESS_CERTS_URL = ACCESS_ISSUER + "/cdn-cgi/access/certs";

let cachedKeys = null;
let keysExpireAt = 0;

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function decodeJsonPart(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

async function getAccessKeys() {
  if (cachedKeys && Date.now() < keysExpireAt) return cachedKeys;

  const response = await fetch(ACCESS_CERTS_URL, {
    headers: { Accept: "application/json" },
    cf: { cacheTtl: 300, cacheEverything: true }
  });
  if (!response.ok) throw new Error("Access signing keys are unavailable.");

  const result = await response.json();
  if (!Array.isArray(result.keys)) throw new Error("Access signing keys are invalid.");
  cachedKeys = result.keys;
  keysExpireAt = Date.now() + 5 * 60 * 1000;
  return cachedKeys;
}

export async function isOfficeUser(request) {
  try {
    const token = request.headers.get("Cf-Access-Jwt-Assertion");
    if (!token) return false;

    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const header = decodeJsonPart(parts[0]);
    const claims = decodeJsonPart(parts[1]);

    if (header.alg !== "RS256" || !header.kid) return false;
    if (claims.iss !== ACCESS_ISSUER) return false;
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audiences.includes(ACCESS_AUDIENCE)) return false;

    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(claims.exp) || claims.exp <= now) return false;
    if (Number.isFinite(claims.nbf) && claims.nbf > now + 30) return false;
    if (Number.isFinite(claims.iat) && claims.iat > now + 30) return false;
    if (String(claims.email || "").toLowerCase() !== ALLOWED_EMAIL) return false;

    const jwk = (await getAccessKeys()).find(key => key.kid === header.kid && key.kty === "RSA");
    if (!jwk) return false;

    const publicKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signedContent = new TextEncoder().encode(parts[0] + "." + parts[1]);
    const signature = decodeBase64Url(parts[2]);
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signature, signedContent);
  } catch (_) {
    return false;
  }
}

