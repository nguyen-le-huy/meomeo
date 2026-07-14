import mongoose from "mongoose";

const dictionaryHistorySchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, trim: true, maxlength: 120, default: "global" },
    query: { type: String, required: true, trim: true, maxlength: 1200 },
    normalizedQuery: { type: String, required: true, trim: true, lowercase: true, maxlength: 1200 },
    result: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

dictionaryHistorySchema.index({ updatedAt: -1 });
dictionaryHistorySchema.index({ normalizedQuery: 1 });
dictionaryHistorySchema.index({ sessionId: 1, createdAt: -1 });
dictionaryHistorySchema.index({ sessionId: 1, normalizedQuery: 1 }, { unique: true });

export const DictionaryHistory = mongoose.model("DictionaryHistory", dictionaryHistorySchema);
