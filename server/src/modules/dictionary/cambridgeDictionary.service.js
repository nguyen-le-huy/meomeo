import * as cheerio from "cheerio";
import { config } from "../../config/env.js";

const CAMBRIDGE_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function uniqueItems(items, limit = 8) {
  const seen = new Set();
  const result = [];

  for (const item of items.map(cleanText).filter(Boolean)) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= limit) break;
  }

  return result;
}

function buildCambridgeUrl(query) {
  const slug = encodeURIComponent(cleanText(query).toLowerCase()).replace(/%20/g, "-");
  return `${config.cambridgeDictionary.baseUrl.replace(/\/+$/, "")}/${slug}`;
}

function parseCambridgeHtml(html, query) {
  const $ = cheerio.load(html);
  const headword = cleanText($("h1").first().text()) || query;
  const partOfSpeech = uniqueItems($(".pos").map((_, element) => $(element).text()).get(), 4).join(", ");
  const phonetic = uniqueItems($(".ipa").map((_, element) => `/${$(element).text()}/`).get(), 2).join(" ");
  const audioPath = $(".us.dpron-i source[type='audio/mpeg']").first().attr("src")
    || $(".uk.dpron-i source[type='audio/mpeg']").first().attr("src")
    || $("source[type='audio/mpeg']").first().attr("src")
    || "";
  const audioUrl = audioPath ? new URL(audioPath, "https://dictionary.cambridge.org").toString() : "";

  const definitions = [];
  const translations = [];
  const examples = [];

  $(".def-block").each((_, block) => {
    const definition = cleanText($(block).find(".def").first().text());
    const translation = cleanText($(block).find(".trans").first().text());

    if (definition) definitions.push(definition);
    if (translation) translations.push(translation);

    $(block).find(".examp").each((__, exampleElement) => {
      const example = cleanText($(exampleElement).find(".eg").first().text())
        || cleanText($(exampleElement).text());
      if (example) examples.push(example);
    });
  });

  const vietnameseMeanings = uniqueItems(translations, 10);
  if (!vietnameseMeanings.length) return null;

  return {
    query,
    normalizedQuery: cleanText(headword).toLowerCase(),
    inputType: cleanText(query).split(/\s+/).length > 1 ? "phrase" : "word",
    source: "cambridge",
    sourceLabel: "Cambridge Dictionary",
    partOfSpeech,
    phonetic,
    audioUrl,
    pronunciationHint: "",
    vietnameseMeaning: vietnameseMeanings.join("; "),
    contextualMeaning: "",
    explanation: uniqueItems(definitions, 5).join(" "),
    nuance: "",
    translation: "",
    examples: uniqueItems(examples, 6),
    collocations: [],
    relatedTerms: [],
    notes: ["Nguồn: Cambridge English-Vietnamese Dictionary."],
  };
}

export async function lookupCambridgeDictionary(query) {
  if (!config.cambridgeDictionary.enabled) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.cambridgeDictionary.timeoutMs);

  const response = await fetch(buildCambridgeUrl(query), {
    signal: controller.signal,
    headers: {
      "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
      "User-Agent": CAMBRIDGE_USER_AGENT,
    },
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) return null;

  const html = await response.text();
  return parseCambridgeHtml(html, query);
}
