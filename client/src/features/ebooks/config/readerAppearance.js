export const READER_FONTS = [
  { id: "serif", label: "Georgia", description: "Cổ điển, dễ đọc", css: "Georgia, 'Times New Roman', serif" },
  { id: "bbc", label: "Reith Serif", description: "Biên tập hiện đại", css: "'BBC Reith Serif', Georgia, serif" },
  { id: "palatino", label: "Palatino", description: "Mềm và thoáng", css: "Palatino, 'Palatino Linotype', 'Book Antiqua', serif" },
  { id: "bookman", label: "Bookman", description: "Nét rộng, rõ ràng", css: "Bookman, 'Bookman Old Style', Georgia, serif" },
  { id: "sans", label: "Arial", description: "Gọn và trung tính", css: "Arial, Helvetica, sans-serif" },
  { id: "reithSans", label: "Reith Sans", description: "Sạch, tối ưu màn hình", css: "'BBC Reith Sans', Arial, sans-serif" },
  { id: "verdana", label: "Verdana", description: "Rõ nét ở cỡ nhỏ", css: "Verdana, Geneva, sans-serif" },
];

export const READER_THEMES = [
  {
    id: "light",
    label: "Sáng",
    description: "Trắng dịu",
    background: "#faf9f5",
    foreground: "#202224",
    muted: "#6c6a64",
    border: "#e6dfd8",
    surface: "#f5f0e8",
    accent: "#a9583e",
  },
  {
    id: "paper",
    label: "Giấy",
    description: "Ấm, ít chói",
    background: "#f6f1e7",
    foreground: "#302c25",
    muted: "#746b5c",
    border: "#ded3c1",
    surface: "#ebe2d3",
    accent: "#9b5d3f",
  },
  {
    id: "sepia",
    label: "Sepia",
    description: "Cảm giác sách in",
    background: "#f4ead7",
    foreground: "#453b2b",
    muted: "#7a6650",
    border: "#d9cbb4",
    surface: "#eadcc3",
    accent: "#995c36",
  },
  {
    id: "sage",
    label: "Xanh dịu",
    description: "Êm mắt ban ngày",
    background: "#e9efe8",
    foreground: "#28352c",
    muted: "#607064",
    border: "#cdd8cc",
    surface: "#dce6da",
    accent: "#526e5a",
  },
  {
    id: "dark",
    label: "Tối",
    description: "Đọc buổi tối",
    background: "#252320",
    foreground: "#f6f0e5",
    muted: "#d7ccbc",
    border: "#45413b",
    surface: "#34312d",
    accent: "#e7a084",
  },
  {
    id: "midnight",
    label: "Đêm sâu",
    description: "Tương phản dịu",
    background: "#171b22",
    foreground: "#e8edf3",
    muted: "#aeb8c5",
    border: "#343b47",
    surface: "#242a34",
    accent: "#9fc3e8",
  },
];

export const READER_FONT_IDS = READER_FONTS.map((font) => font.id);
export const READER_THEME_IDS = READER_THEMES.map((theme) => theme.id);

export function getReaderFont(id) {
  return READER_FONTS.find((font) => font.id === id) || READER_FONTS[0];
}

export function getReaderTheme(id) {
  return READER_THEMES.find((theme) => theme.id === id) || READER_THEMES[0];
}
