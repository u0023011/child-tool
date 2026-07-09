const COUNTER_KEYS = {
  home: "home_total_views",
  childcare_law: "tool_childcare_law_views",
  age_tool: "tool_age_tool_views",
  report_date_tool: "tool_report_date_tool_views"
};

function getCounterKey(request) {
  const url = new URL(request.url);
  const queryCounter = url.searchParams.get("counter");

  return queryCounter && COUNTER_KEYS[queryCounter]
    ? COUNTER_KEYS[queryCounter]
    : COUNTER_KEYS.home;
}

async function readCount(env, key) {
  let current = await env.VISITOR_COUNTER.get(key);
  let count = current ? parseInt(current, 10) : 0;

  if (Number.isNaN(count)) {
    count = 0;
  }

  return count;
}

function jsonResponse(data) {
  return new Response(
    JSON.stringify(data),
    {
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let counterName = "home";

  try {
    const body = await request.json();
    if (body && body.counter) {
      counterName = body.counter;
    }
  } catch (error) {
    // 沒有 JSON 內容時，預設計算首頁瀏覽人次
  }

  const key = COUNTER_KEYS[counterName] || COUNTER_KEYS.home;
  let count = await readCount(env, key);

  count += 1;
  await env.VISITOR_COUNTER.put(key, String(count));

  return jsonResponse({
    ok: true,
    counter: counterName,
    count: count
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const key = getCounterKey(request);
  const count = await readCount(env, key);

  return jsonResponse({
    ok: true,
    count: count
  });
}
