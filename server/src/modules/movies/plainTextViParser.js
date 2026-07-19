/**
 * Parser for plain-text Vietnamese subtitle format.
 *
 * Format rules:
 *  - Each line corresponds to one English segment (by index order).
 *  - Lines starting with "#" are comments and are skipped entirely
 *    (they do NOT occupy a slot).
 *  - Empty lines represent "no translation for this slot" (the slot IS counted).
 *  - Leading/trailing whitespace is trimmed from each line.
 *
 * Example input:
 *   # Câu 1 tiếng Anh: "Once upon a time..."
 *   Ngày xửa ngày xưa...
 *   # Câu 2: "There was a dragon."
 *   Có một con rồng.
 *   # Câu 3: bỏ qua, để trống
 *
 * Returns:
 *   translations: (string | null)[] — one entry per slot.
 *     string  → use this as translationText
 *     null    → skip (don't update this segment)
 */
export function parsePlainTextVi(content) {
  const lines = String(content || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n");

  const translations = [];
  const warnings = [];

  for (const raw of lines) {
    const line = raw.trim();

    // Comment lines — skip, don't count as a slot
    if (line.startsWith("#")) continue;

    // Empty line → slot with no translation
    if (!line) {
      translations.push(null);
      continue;
    }

    translations.push(line);
  }

  if (!translations.length) {
    return { translations: [], warnings, errors: [{ message: "No content found in the file" }] };
  }

  const nonEmptyCount = translations.filter(Boolean).length;
  if (!nonEmptyCount) {
    return { translations: [], warnings, errors: [{ message: "All lines are empty — no translations to save" }] };
  }

  return { translations, warnings, errors: [] };
}
