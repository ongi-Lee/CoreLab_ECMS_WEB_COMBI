// Supabase Edge Function: generate-image
// Deno + TypeScript 환경에서 실행됩니다.
// 완성된 영어 프롬프트를 받아
// Gemini 이미지 API로 동화 화풍의 이미지를 생성합니다.

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
    const { prompt } = await req.json();

    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 10_000) {
      return new Response(
        JSON.stringify({ error: "prompt가 필요합니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Supabase Secrets에서 이미지 생성 전용 API 키를 안전하게 가져옵니다
    const geminiApiKey = Deno.env.get("GEMINI_IMAGE_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "서버에 GEMINI_IMAGE_API_KEY가 설정되지 않았습니다." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 동화 화풍 + 안전 키워드를 백엔드에서 추가
    // (프론트엔드에서 전송되는 프롬프트에 항상 이 내용이 붙습니다)
    const safeStoryPrompt = [
      prompt,
      "children's storybook illustration style,",
      "soft watercolor and pastel color palette,",
      "cute and friendly character design,",
      "warm gentle lighting, whimsical fairytale atmosphere,",
      "safe for children, no violence, no adult content,",
      "high quality digital illustration",
    ].join(" ");

    // 텍스트 모델과 이미지 모델을 따로 설정합니다.
    const model = Deno.env.get("GEMINI_IMAGE_MODEL") || "gemini-3.1-flash-lite-image";
    const geminiData = await callGemini(geminiApiKey, model, {
      contents: [{ role: "user", parts: [{ text: safeStoryPrompt }] }],
      generationConfig: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      },
    });

    // Gemini 3.1과 이전 버전의 이미지 응답 포맷(inlineData 및 blob)을 둘 다 지원하도록 파싱
    const parts = geminiData.candidates?.[0]?.content?.parts || [];
    let imageBytes = "";
    let mimeType = "image/png";

    for (const part of parts) {
      if (part.thought) continue;
      if (part.inlineData?.data && part.inlineData.mimeType?.startsWith("image/")) {
        imageBytes = part.inlineData.data;
        mimeType = part.inlineData.mimeType || "image/png";
        break;
      } else if (part.blob?.content && part.blob.mimeType?.startsWith("image/")) {
        imageBytes = part.blob.content;
        mimeType = part.blob.mimeType || "image/png";
        break;
      }
    }

    if (!imageBytes) {
      throw new Error("이미지 데이터가 반환되지 않았습니다. 프롬프트를 확인해주세요.");
    }

    return new Response(
      JSON.stringify({
        imageBytes: imageBytes,
        mimeType:   mimeType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return geminiErrorResponse(err, corsHeaders);
  }
});
