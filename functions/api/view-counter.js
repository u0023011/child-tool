const COUNTER_KEYS = {
  home: "home_total_views",
  childcare_law: "tool_childcare_law_views",
  age_tool: "tool_age_tool_views",
  report_date_tool: "tool_report_date_tool_views",
  receipt_tool: "tool_receipt_tool_views",
  report_generator: "tool_report_generator_views",
  training_hours_tool: "tool_training_hours_tool_views"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
}

function resolveCounterName(request) {
  const url = new URL(request.url);
  return url.searchParams.get("counter") || "home";
}

function resolveCounterKey(counterName) {
  return COUNTER_KEYS[counterName] || null;
}

async function readCount(env, key) {
  const current = await env.VISITOR_COUNTER.get(key);
  const count = current ? parseInt(current, 10) : 0;
  return Number.isNaN(count) ? 0 : count;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const counterName = resolveCounterName(request);
  const key = resolveCounterKey(counterName);

  if (!key) {
    return jsonResponse(
      {
        ok: false,
        message: "未知的人次計數器",
        counter: counterName
      },
      400
    );
  }

  const count = await readCount(env, key);

  return jsonResponse({
    ok: true,
    counter: counterName,
    count
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let counterName = resolveCounterName(request);

  try {
    const body = await request.json();

    if (body && body.counter) {
      counterName = String(body.counter);
    }
  } catch (error) {
    // 沒有 JSON 內容時，使用網址參數；
    // 若網址也沒有指定，則預設計算首頁。
  }

  const key = resolveCounterKey(counterName);

  if (!key) {
    return jsonResponse(
      {
        ok: false,
        message: "未知的人次計數器",
        counter: counterName
      },
      400
    );
  }

  let count = await readCount(env, key);
  count += 1;

  await env.VISITOR_COUNTER.put(key, String(count));

  return jsonResponse({
    ok: true,
    counter: counterName,
    count
  });
}