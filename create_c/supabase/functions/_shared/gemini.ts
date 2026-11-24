// Retry explicit upstream failures only. A broken connection can occur after
// generation starts, so replaying that request could duplicate paid work.
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const MAX_WAIT_MS = 15_000;

export class GeminiError extends Error {
  constructor(
    public status: number,
    public upstreamStatus: number,
    public attempts: number,
    public retryable: boolean,
    message: string,
  ) {
    super(message);
  }
}

function retryDelay(value: string | null, attempt: number): number {
  if (value) {
    const seconds = Number(value);
    const delay = Number.isFinite(seconds)
      ? seconds * 1000
      : Date.parse(value) - Date.now();
    if (Number.isFinite(delay)) return Math.max(0, delay);
  }
  return 1000 * 2 ** (attempt - 1) + Math.floor(Math.random() * 1000);
}

export async function callGemini(
  apiKey: string,
  model: string,
  body: unknown,
  timeoutMs = 90_000,
) {
  const deadline = Date.now() + timeoutMs;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(Math.max(1, deadline - Date.now())),
        },
      );
    } catch {
      // Do not log URLs, prompts or keys.
      throw new GeminiError(504, 0, attempt, false,
        "AI 서버 연결이 끊어졌거나 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
    }
    if (response.ok) {
      try {
        return await response.json();
      } catch {
        throw new GeminiError(502, response.status, attempt, false,
          "AI 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    }
    const upstreamStatus = response.status;
    const retryable = RETRYABLE_STATUS.has(upstreamStatus);
    const delay = retryDelay(response.headers.get("Retry-After"), attempt);
    // Never send Google's raw response (which can include project details).
    await response.body?.cancel().catch(() => {});
    if (retryable && attempt < MAX_ATTEMPTS && delay <= MAX_WAIT_MS &&
        Date.now() + delay < deadline) {
      console.warn("Gemini retry", { model, upstreamStatus, attempt });
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    let message = "AI 서버 요청에 실패했습니다. 선생님께 문의해 주세요.";
    if (upstreamStatus === 503) {
      message = "AI 서버에 요청이 몰리고 있습니다. 잠시 후 다시 시도해 주세요.";
    } else if (upstreamStatus === 429) {
      message = "AI 요청 한도에 도달했습니다. 잠시 후 다시 시도하거나 선생님께 문의해 주세요.";
    } else if (upstreamStatus === 404) {
      message = "설정된 AI 모델을 사용할 수 없습니다. 선생님께 문의해 주세요.";
    } else if ([401, 402, 403].includes(upstreamStatus)) {
      message = "AI 서버의 API 키·권한·결제 설정을 확인해야 합니다. 선생님께 문의해 주세요.";
    } else if (retryable) {
      message = "AI 서버에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }
    // Server API-key errors must not appear as student login errors.
    throw new GeminiError(retryable ? upstreamStatus : 502,
      upstreamStatus, attempt, retryable, message);
  }
  throw new Error("Unreachable retry state");
}

export function geminiErrorResponse(error: unknown, corsHeaders: Record<string, string>) {
  const known = error instanceof GeminiError;
  console.error("Gemini request failed", known
    ? { upstreamStatus: error.upstreamStatus, attempts: error.attempts }
    : { type: error instanceof Error ? error.name : "UnknownError" });
  return new Response(JSON.stringify({
    error: known ? error.message : "AI 응답을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    upstreamStatus: known ? error.upstreamStatus : undefined,
    attempts: known ? error.attempts : undefined,
    retryable: known ? error.retryable : false,
    // The browser must not multiply the server's bounded retries.
    retriesExhausted: true,
  }), {
    status: known ? error.status : 502,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
