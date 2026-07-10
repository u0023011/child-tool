async function sign(value, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const parts = cookie.split(";").map(v => v.trim());
  for (const part of parts) {
    if (part.startsWith(name + "=")) {
      return part.slice(name.length + 1);
    }
  }
  return "";
}

async function verifyToken(token, secret) {
  if (!token || !secret) return "";

  const parts = token.split(".");
  if (parts.length !== 3) return "";

  const [role, issuedAt, sig] = parts;
  if (!["basic", "admin"].includes(role)) return "";

  const ageMs = Date.now() - Number(issuedAt);
  if (!Number.isFinite(ageMs) || ageMs < 0) return "";

  // 最長 8 小時有效，避免長期留下登入狀態
  if (ageMs > 8 * 60 * 60 * 1000) return "";

  const expected = await sign(`${role}.${issuedAt}`, secret);
  return expected === sig ? role : "";
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 首頁、圖示、manifest、service worker、API 登入登出不擋
  if (
    path === "/" ||
    path === "/index.html" ||
    path === "/manifest.json" ||
    path === "/service-worker.js" ||
    path === "/favicon.ico" ||
    path === "/icon-192.png" ||
    path === "/icon-512.png" ||
    path === "/apple-touch-icon.png" ||
    path.startsWith("/api/")
  ) {
    return next();
  }

  const protectedRules = [
    { prefix: "/age-tool", roles: ["basic", "admin"] },
    { prefix: "/childcare-law", roles: ["admin"] },
    { prefix: "/report-date-tool", roles: ["admin"] },
    { prefix: "/receipt-tool", roles: ["admin"] }
  ];

  const rule = protectedRules.find(r => path === r.prefix || path.startsWith(r.prefix + "/"));
  if (!rule) {
    return next();
  }

  const role = await verifyToken(getCookie(request, "tool_auth"), env.AUTH_SECRET);

  if (role && rule.roles.includes(role)) {
    return next();
  }

  return Response.redirect(url.origin + "/", 302);
}
