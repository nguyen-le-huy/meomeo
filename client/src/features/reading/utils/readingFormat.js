export function formatReadingDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function normalizeReading(reading) {
  if (!reading) return null;
  return {
    ...reading,
    displayDate: reading.displayDate || formatReadingDate(reading.publishedAt || reading.createdAt),
    durationLabel: reading.durationLabel || "5 phút",
    level: reading.level || "TOEIC A2",
    imageCredit: reading.imageCredit || "Meomeo Library",
    secondaryImageCredit: reading.secondaryImageCredit || "Meomeo Library",
    paragraphs: reading.paragraphs || [],
    bodyHtml: reading.bodyHtml || "",
    questions: reading.questions || [],
  };
}
