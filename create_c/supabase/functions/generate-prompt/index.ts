// Supabase Edge Function: generate-prompt
// Deno + TypeScript 환경에서 실행됩니다.
// 학생이 선택한 주인공/배경/행동을 받아
// Gemini 텍스트 API로 안전하고 동화적인 프롬프트를 자동 생성합니다.

import { callGemini, geminiErrorResponse } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // OPTIONS preflight 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { character, background, action } = await req.json();

    if (![character, background, action].every((value) =>
      typeof value === "string" && value.trim().length > 0 && value.length <= 300)) {
      return new Response(
        JSON.stringify({ error: "character, background, action이 모두 필요합니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Supabase Secrets에서 API 키를 안전하게 가져옵니다
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "서버에 GEMINI_API_KEY가 설정되지 않았습니다." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gemini에게 프롬프트 생성을 요청하는 시스템 메시지
    const systemInstruction = `
당신은 초등학교 미술 선생님입니다.
아이들을 위한 동화책 그림 생성 AI 프롬프트 전문가입니다.

규칙:
1. 절대로 폭력적, 선정적, 무서운 내용을 포함하지 마세요.
2. 항상 밝고, 귀엽고, 따뜻한 동화책 분위기여야 합니다.
3. 응답은 반드시 아래 JSON 형식으로만 답하세요.

{
  "koreanPrompt": "학생이 읽을 한국어 문장 (1~2줄, 동화책 나레이션 스타일)",
  "englishPrompt": "Imagen AI 이미지 생성용 영어 프롬프트 (50~80 단어, 동화책 일러스트 스타일 키워드 포함)"
}
`;

    const userMessage = `주인공: ${character}, 배경: ${background}, 행동: ${action}`;

    // 모델은 Supabase Secret으로 변경할 수 있습니다.
    const model = Deno.env.get("GEMINI_TEXT_MODEL") || "gemini-3.1-flash-lite";
    const geminiData = await callGemini(geminiApiKey, model, {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: "application/json",
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_LOW_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_LOW_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_LOW_AND_ABOVE" },
      ],
    }, 45_000);
    const rawText = (geminiData.candidates?.[0]?.content?.parts || [])
      .filter((part: { thought?: boolean; text?: string }) => !part.thought && part.text)
      .map((part: { text: string }) => part.text).join("");

    if (!rawText) {
      throw new Error("Gemini API에서 프롬프트를 생성하지 못했습니다.");
    }

    // JSON 파싱
    const parsed = JSON.parse(rawText);
    if (![parsed.koreanPrompt, parsed.englishPrompt].every((value) =>
      typeof value === "string" && value.trim())) {
      throw new Error("프롬프트 응답 형식이 올바르지 않습니다.");
    }

    return new Response(
      JSON.stringify({
        koreanPrompt:  parsed.koreanPrompt,
        englishPrompt: parsed.englishPrompt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return geminiErrorResponse(err, corsHeaders);
  }
});
