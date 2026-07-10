export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": "tool_auth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
    }
  });
}

export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": "tool_auth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
    }
  });
}
