import OpenAI from "openai";
import { config } from "../../config/env.js";

let openaiClient;

function getClient() {
  if (!openaiClient) {
    if (!config.openAi.apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    openaiClient = new OpenAI({
      apiKey: config.openAi.apiKey,
      timeout: 60000,
      maxRetries: 0,
    });
  }
  return openaiClient;
}

function buildSystemPrompt() {
  return `You are a subtitle translator. Translate English subtitles to natural Vietnamese.

Return ONLY a JSON object with this exact structure:
{
  "translations": [
    { "id": "<id from input>", "translationText": "<Vietnamese translation>" }
  ]
}

Rules:
- Keep translations concise and subtitle-friendly
- Do NOT change the id values
- Do NOT wrap the JSON in markdown code blocks
- Do NOT add any text outside the JSON`;
}

function buildUserPayload(segments, targetLanguage) {
  return {
    targetLanguage,
    segments: segments.map((s) => ({
      id: s._id.toString(),
      index: s.index,
      text: s.text,
    })),
  };
}

export async function translateSegmentsInBatches(segments, options = {}) {
  const targetLanguage = options.targetLanguage || config.openAi.translationTargetLanguage || "vi";
  const batchSize = options.batchSize || 20;
  const model = config.openAi.translationModel;

  const client = getClient();
  const systemPrompt = buildSystemPrompt();
  let translatedCount = 0;
  let failedCount = 0;
  const allResults = [];

  console.log(`[Vietsub] Bắt đầu dịch ${segments.length} segments, batch size ${batchSize}, model ${model}`);

  for (let i = 0; i < segments.length; i += batchSize) {
    const batch = segments.slice(i, i + batchSize);
    const userPayload = buildUserPayload(batch, targetLanguage);

    console.log(`[Vietsub] Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(segments.length / batchSize)} (${batch.length} segments)`);

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      temperature: 0.3,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      console.error("[Vietsub] OpenAI trả về response rỗng:", JSON.stringify(completion.choices?.[0]?.message));
      failedCount += batch.length;
      continue;
    }

    const jsonStr = content.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("[Vietsub] Không parse được JSON từ OpenAI:", jsonStr.slice(0, 500));
      failedCount += batch.length;
      continue;
    }

    const translations = parsed.translations || parsed.segments || [];
    for (const item of translations) {
      const segment = batch.find((s) => s._id.toString() === item.id);
      if (!segment) {
        failedCount++;
        continue;
      }
      const translatedText = item.translationText || item.text || "";
      if (translatedText && typeof translatedText === "string" && translatedText.trim()) {
        segment.translationText = translatedText.trim();
        segment.translationLanguage = targetLanguage;
        segment.translationStatus = "translated";
        segment.translationError = "";
        segment.translatedAt = new Date();
        translatedCount++;
      } else {
        segment.translationStatus = "failed";
        segment.translationError = "Empty translation returned";
        failedCount++;
      }
      allResults.push(segment);
    }
  }

  console.log(`[Vietsub] Hoàn thành: ${translatedCount} translated, ${failedCount} failed`);
  return { translatedCount, failedCount, segments: allResults };
}
