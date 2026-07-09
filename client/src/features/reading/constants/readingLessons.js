export const readingLessons = [
  {
    slug: "daily-workplace-safety",
    title: "Workplace Safety Notice",
    eyebrow: "Bài đọc hôm nay",
    publishedAt: "2026-07-08T08:00:00.000Z",
    displayDate: "8 July 2026",
    author: "Meo Meo English",
    authorRole: "Reading Practice Editor",
    level: "TOEIC A2",
    durationLabel: "5 phút",
    imageUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    imageCredit: "Meomeo Library",
    imageCaption: "Office notices are common in short TOEIC reading passages.",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
    secondaryImageCredit: "Meomeo Library",
    secondaryImageCaption: "Visitors usually need to check in before entering a work area.",
    summary: "Đọc một thông báo ngắn tại văn phòng và luyện trả lời câu hỏi TOEIC.",
    paragraphs: [
      "All employees must wear their ID cards while they are inside the office building. The new rule applies to every department, including sales, accounting and customer support.",
      "Visitors should check in at the front desk and wait for a staff member before entering the work area. The receptionist will print a temporary visitor pass and call the host employee.",
      "The security team will update the visitor policy next Monday. Managers are asked to remind their teams before the end of this week.",
      "The company says the change will make the office safer and help staff identify guests more quickly during busy hours.",
    ],
    questions: [
      {
        prompt: "What must employees wear inside the office building?",
        choices: ["A uniform", "An ID card", "A name tag", "A safety helmet"],
        answer: "An ID card",
      },
      {
        prompt: "Where should visitors check in?",
        choices: ["At the front desk", "In the meeting room", "At the cafeteria", "Beside the elevator"],
        answer: "At the front desk",
      },
    ],
  },
];

export function getLatestReadingLesson(lessons = readingLessons) {
  return [...lessons].sort((first, second) => new Date(second.publishedAt) - new Date(first.publishedAt))[0] || null;
}
