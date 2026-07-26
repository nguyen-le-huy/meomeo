import OpenAI from "openai";
import { config } from "../../config/env.js";
import { getTranslationModel } from "./translationModels.js";

const clients = new Map();

function getClient(provider) {
  if (clients.has(provider)) return clients.get(provider);

  const providerConfig = provider === "deepseek"
    ? {
        apiKey: config.deepSeek.apiKey,
        baseURL: config.deepSeek.baseUrl,
        keyName: "DEEPSEEK_API_KEY",
      }
    : {
        apiKey: config.openAi.apiKey,
        baseURL: undefined,
        keyName: "OPENAI_API_KEY",
      };

  if (!providerConfig.apiKey) {
    throw new Error(`${providerConfig.keyName} is not configured`);
  }

  const client = new OpenAI({
    apiKey: providerConfig.apiKey,
    baseURL: providerConfig.baseURL,
    timeout: 90000,
    maxRetries: 1,
  });
  clients.set(provider, client);
  return client;
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
  const batchSize = options.batchSize || 30;
  const concurrency = options.concurrency || 3;
  const model = options.model || config.openAi.translationModel;
  const modelConfig = getTranslationModel(model);
  if (!modelConfig) throw new Error(`Unsupported translation model: ${model}`);

  const client = getClient(modelConfig.provider);
  const systemPrompt = buildSystemPrompt();
  let translatedCount = 0;
  let failedCount = 0;
  const allResults = [];

  const batches = [];
  for (let i = 0; i < segments.length; i += batchSize) {
    batches.push(segments.slice(i, i + batchSize));
  }

  console.log(
    `[Vietsub] Bắt đầu dịch ${segments.length} segments (${batches.length} batches, size ${batchSize}, concurrency ${concurrency}, model ${model})`,
  );

  for (let i = 0; i < batches.length; i += concurrency) {
    const chunk = batches.slice(i, i + concurrency);
    const chunkPromises = chunk.map(async (batch, chunkIndex) => {
      const batchNum = i + chunkIndex + 1;
      const userPayload = buildUserPayload(batch, targetLanguage);
      console.log(`[Vietsub] Batch ${batchNum}/${batches.length} (${batch.length} segments)...`);

      const request = {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
        response_format: { type: "json_object" },
      };
      if (modelConfig.provider === "deepseek") {
        request.temperature = 0.3;
        request.max_tokens = Math.max(2000, batch.length * 160);
        request.thinking = { type: "disabled" };
      } else {
        request.reasoning_effort = model === "gpt-5.4-mini" ? "none" : "minimal";
      }

      try {
        const completion = await client.chat.completions.create(request);
        const content = completion.choices?.[0]?.message?.content;
        if (!content) {
          console.error(`[Vietsub] Batch ${batchNum} rỗng:`, JSON.stringify(completion.choices?.[0]?.message));
          return { translated: 0, failed: batch.length, segments: [] };
        }

        const jsonStr = content.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
        let parsed;
        try {
          parsed = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error(`[Vietsub] Batch ${batchNum} không parse được JSON:`, jsonStr.slice(0, 300));
          return { translated: 0, failed: batch.length, segments: [] };
        }

        const translations = parsed.translations || parsed.segments || [];
        let bTranslated = 0;
        let bFailed = 0;
        const bResults = [];

        for (const item of translations) {
          const segment = batch.find((s) => s._id.toString() === item.id);
          if (!segment) {
            bFailed++;
            continue;
          }
          const translatedText = item.translationText || item.text || "";
          if (translatedText && typeof translatedText === "string" && translatedText.trim()) {
            segment.translationText = translatedText.trim();
            segment.translationLanguage = targetLanguage;
            segment.translationStatus = "translated";
            segment.translationError = "";
            segment.translatedAt = new Date();
            bTranslated++;
          } else {
            segment.translationStatus = "failed";
            segment.translationError = "Empty translation returned";
            bFailed++;
          }
          bResults.push(segment);
        }
        return { translated: bTranslated, failed: bFailed, segments: bResults };
      } catch (error) {
        console.error(`[Vietsub] Batch ${batchNum} lỗi API:`, error.message);
        return { translated: 0, failed: batch.length, segments: [] };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    const chunkSegments = [];
    for (const res of chunkResults) {
      translatedCount += res.translated;
      failedCount += res.failed;
      chunkSegments.push(...res.segments);
      allResults.push(...res.segments);
    }

    if (typeof options.onChunkCompleted === "function") {
      try {
        await options.onChunkCompleted({
          chunkTranslatedCount: chunkResults.reduce((acc, r) => acc + r.translated, 0),
          translatedCount,
          failedCount,
          chunkSegments,
          totalSegments: segments.length,
        });
      } catch (cbError) {
        console.error("[Vietsub] Lỗi trong callback onChunkCompleted:", cbError.message);
      }
    }
  }

  console.log(`[Vietsub] Hoàn thành: ${translatedCount} translated, ${failedCount} failed`);
  return { translatedCount, failedCount, segments: allResults };
}
