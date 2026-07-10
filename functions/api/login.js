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

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.BASIC_PASSWORD || !env.ADMIN_PASSWORD || !env.AUTH_SECRET) {
    return json({
      ok: false,
      message: "後端尚未設定 BASIC_PASSWORD、ADMIN_PASSWORD、AUTH_SECRET"
    }, 500);
  }

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, message: "資料格式錯誤" }, 400);
  }

  const password = String(body.password || "").trim();
  let role = "";

  if (password === env.BASIC_PASSWORD) {
    role = "basic";
  } else if (password === env.ADMIN_PASSWORD) {
    role = "admin";
  }

  if (!role) {
    return json({ ok: false, message: "密碼錯誤" }, 401);
  }

  const issuedAt = Date.now();
  const payload = `${role}.${issuedAt}`;
  const sig = await sign(payload, env.AUTH_SECRET);
  const token = `${payload}.${sig}`;

  return json(
    { ok: true, role },
    200,
    {
      "Set-Cookie": `tool_auth=${token}; Path=/; HttpOnly; Secure; SameSite=Lax`
    }
  );
}

export async function onRequestGet() {
  return json({ ok: false, message: "Method Not Allowed" }, 405);
}
