export const lessonTypes = [
  {
    id: "flashcards",
    title: "Flashcard từ vựng",
    shortTitle: "Flashcard",
    description: "Lật thẻ để nhớ nghĩa, phát âm và ví dụ.",
  },
  {
    id: "match-meaning",
    title: "Chọn cặp từ",
    shortTitle: "Ghép cặp",
    description: "Ghép từ tiếng Anh với nghĩa tiếng Việt tương ứng.",
  },
  {
    id: "listening-fill",
    title: "Viết lại câu",
    shortTitle: "Viết câu",
    description: "Sắp xếp các từ để viết lại câu bằng tiếng Anh hoặc tiếng Việt.",
  },
  {
    id: "cloze-quiz",
    title: "Nghe đục lỗ",
    shortTitle: "Nghe đục lỗ",
    description: "Nghe câu mẫu rồi nhập từ còn thiếu.",
  },
];

export const vocabularyDays = [
  {
    id: "day-1",
    label: "Ngày 1",
    date: "2026-07-16",
    title: "Daily Routine",
    subtitle: "Những từ dùng trong sinh hoạt hằng ngày",
    words: [
      {
        word: "routine",
        meaning: "thói quen hằng ngày",
        phonetic: "/ruːˈtiːn/",
        example: "My morning routine starts with a cup of coffee.",
        translation: "Thói quen buổi sáng của tôi bắt đầu bằng một tách cà phê.",
        collocations: ["daily routine", "morning routine", "change your routine"],
      },
      {
        word: "commute",
        meaning: "đi làm, đi học hằng ngày",
        phonetic: "/kəˈmjuːt/",
        example: "I commute by bus every morning.",
        translation: "Tôi đi làm bằng xe buýt mỗi sáng.",
        collocations: ["daily commute", "commute by bus", "long commute"],
      },
      {
        word: "prepare",
        meaning: "chuẩn bị",
        phonetic: "/prɪˈpeər/",
        example: "She prepares breakfast before work.",
        translation: "Cô ấy chuẩn bị bữa sáng trước khi đi làm.",
        collocations: ["prepare breakfast", "prepare for work", "well prepared"],
      },
      {
        word: "schedule",
        meaning: "lịch trình",
        phonetic: "/ˈʃedjuːl/",
        example: "My schedule is full today.",
        translation: "Lịch trình của tôi hôm nay kín rồi.",
        collocations: ["busy schedule", "daily schedule", "follow a schedule"],
      },
    ],
  },
  {
    id: "day-2",
    label: "Ngày 2",
    date: "2026-07-17",
    title: "Work Talk",
    subtitle: "Từ vựng giao tiếp công việc cơ bản",
    words: [
      {
        word: "deadline",
        meaning: "hạn chót",
        phonetic: "/ˈdedlaɪn/",
        example: "The deadline is Friday afternoon.",
        translation: "Hạn chót là chiều thứ Sáu.",
        collocations: ["meet a deadline", "miss a deadline", "tight deadline"],
      },
      {
        word: "meeting",
        meaning: "cuộc họp",
        phonetic: "/ˈmiːtɪŋ/",
        example: "We have a meeting at ten.",
        translation: "Chúng ta có một cuộc họp lúc mười giờ.",
        collocations: ["attend a meeting", "team meeting", "schedule a meeting"],
      },
      {
        word: "update",
        meaning: "cập nhật",
        phonetic: "/ˌʌpˈdeɪt/",
        example: "Please update the report.",
        translation: "Vui lòng cập nhật báo cáo.",
        collocations: ["update a report", "quick update", "status update"],
      },
      {
        word: "review",
        meaning: "xem lại, đánh giá",
        phonetic: "/rɪˈvjuː/",
        example: "Can you review this document?",
        translation: "Bạn xem lại tài liệu này được không?",
        collocations: ["review a document", "performance review", "quick review"],
      },
    ],
  },
  {
    id: "day-3",
    label: "Ngày 3",
    date: "2026-07-18",
    title: "Small Talk",
    subtitle: "Mở đầu cuộc trò chuyện tự nhiên hơn",
    words: [
      {
        word: "actually",
        meaning: "thật ra",
        phonetic: "/ˈæktʃuəli/",
        example: "Actually, I have a question.",
        translation: "Thật ra, tôi có một câu hỏi.",
        collocations: ["actually true", "actually happen", "actually need"],
      },
      {
        word: "probably",
        meaning: "có lẽ",
        phonetic: "/ˈprɒbəbli/",
        example: "It will probably rain later.",
        translation: "Có lẽ lát nữa trời sẽ mưa.",
        collocations: ["probably right", "probably need", "probably happen"],
      },
      {
        word: "prefer",
        meaning: "thích hơn",
        phonetic: "/prɪˈfɜːr/",
        example: "I prefer tea to coffee.",
        translation: "Tôi thích trà hơn cà phê.",
        collocations: ["prefer tea", "prefer to stay", "strongly prefer"],
      },
      {
        word: "recently",
        meaning: "gần đây",
        phonetic: "/ˈriːsntli/",
        example: "I recently started learning English again.",
        translation: "Gần đây tôi bắt đầu học lại tiếng Anh.",
        collocations: ["recently started", "recently moved", "recently changed"],
      },
    ],
  },
  {
    id: "day-4",
    label: "Ngày 4",
    date: "2026-07-19",
    title: "Money Basics",
    subtitle: "Từ vựng thường gặp về tiền bạc",
    words: [
      {
        word: "budget",
        meaning: "ngân sách",
        phonetic: "/ˈbʌdʒɪt/",
        example: "We need to plan the budget carefully.",
        translation: "Chúng ta cần lên ngân sách cẩn thận.",
        collocations: ["monthly budget", "set a budget", "budget carefully"],
      },
      {
        word: "expense",
        meaning: "chi phí",
        phonetic: "/ɪkˈspens/",
        example: "Rent is my biggest monthly expense.",
        translation: "Tiền thuê nhà là chi phí hằng tháng lớn nhất của tôi.",
        collocations: ["monthly expense", "business expense", "reduce expenses"],
      },
      {
        word: "afford",
        meaning: "có đủ khả năng chi trả",
        phonetic: "/əˈfɔːrd/",
        example: "I cannot afford a new laptop right now.",
        translation: "Hiện tại tôi chưa đủ tiền mua laptop mới.",
        collocations: ["cannot afford", "afford to buy", "barely afford"],
      },
      {
        word: "save",
        meaning: "tiết kiệm",
        phonetic: "/seɪv/",
        example: "I save a little money every week.",
        translation: "Tôi tiết kiệm một ít tiền mỗi tuần.",
        collocations: ["save money", "save time", "save for later"],
      },
    ],
  },
  {
    id: "day-5",
    label: "Ngày 5",
    date: "2026-07-20",
    title: "Travel",
    subtitle: "Từ vựng khi đi lại và du lịch",
    words: [
      {
        word: "destination",
        meaning: "điểm đến",
        phonetic: "/ˌdestɪˈneɪʃn/",
        example: "Da Nang is a popular destination.",
        translation: "Đà Nẵng là một điểm đến phổ biến.",
        collocations: ["popular destination", "travel destination", "final destination"],
      },
      {
        word: "luggage",
        meaning: "hành lý",
        phonetic: "/ˈlʌɡɪdʒ/",
        example: "My luggage is still at the airport.",
        translation: "Hành lý của tôi vẫn ở sân bay.",
        collocations: ["checked luggage", "lost luggage", "carry luggage"],
      },
      {
        word: "arrive",
        meaning: "đến nơi",
        phonetic: "/əˈraɪv/",
        example: "We will arrive before noon.",
        translation: "Chúng tôi sẽ đến trước buổi trưa.",
        collocations: ["arrive early", "arrive safely", "arrive on time"],
      },
      {
        word: "delay",
        meaning: "trì hoãn",
        phonetic: "/dɪˈleɪ/",
        example: "The flight has a short delay.",
        translation: "Chuyến bay bị hoãn một chút.",
        collocations: ["flight delay", "short delay", "delay the meeting"],
      },
    ],
  },
];

export function getVocabularyDay(dayId) {
  return vocabularyDays.find((day) => day.id === dayId);
}

export function getLessonType(lessonId) {
  return lessonTypes.find((lesson) => lesson.id === lessonId);
}

export function formatVocabularyDate(value) {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00+07:00`));
}
