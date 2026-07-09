export async function onRequestPost(context) {
  const { env } = context;

  const key = "home_total_views";

  let current = await env.VISITOR_COUNTER.get(key);
  let count = current ? parseInt(current, 10) : 0;

  if (Number.isNaN(count)) {
    count = 0;
  }

  count += 1;

  await env.VISITOR_COUNTER.put(key, String(count));

  return new Response(
    JSON.stringify({
      ok: true,
      count: count
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function onRequestGet(context) {
  const { env } = context;

  const key = "home_total_views";

  let current = await env.VISITOR_COUNTER.get(key);
  let count = current ? parseInt(current, 10) : 0;

  if (Number.isNaN(count)) {
    count = 0;
  }

  return new Response(
    JSON.stringify({
      ok: true,
      count: count
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "no-store"
      }
    }
  );
}
