import mongoose from "mongoose";

const ebookReaderSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    fontSize: { type: Number, required: true, min: 14, max: 30, default: 18 },
    fontFamily: { type: String, required: true, enum: ["serif", "bbc", "palatino", "bookman", "sans", "reithSans", "verdana"], default: "serif" },
    theme: { type: String, required: true, enum: ["light", "paper", "sepia", "sage", "dark", "midnight"], default: "light" },
    letterSpacing: { type: Number, required: true, min: 0, max: 0.12, default: 0 },
    lineHeight: { type: Number, required: true, min: 1.2, max: 2.2, default: 1.65 },
  },
  { timestamps: true },
);

export const EbookReaderSetting = mongoose.model("EbookReaderSetting", ebookReaderSettingSchema);
