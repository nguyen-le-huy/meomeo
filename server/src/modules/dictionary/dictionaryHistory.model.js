import mongoose from "mongoose";

const dictionaryHistorySchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, trim: true, maxlength: 120, default: "global" },
    query: { type: String, required: true, trim: true, maxlength: 1200 },
    normalizedQuery: { type: String, required: true, trim: true, lowercase: true, maxlength: 1200 },
    lookupDay: { type: String, required: true, trim: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    result: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

dictionaryHistorySchema.index({ updatedAt: -1 });
dictionaryHistorySchema.index({ normalizedQuery: 1 });
dictionaryHistorySchema.index({ sessionId: 1, createdAt: -1 });
dictionaryHistorySchema.index({ sessionId: 1, normalizedQuery: 1, lookupDay: 1 }, { unique: true });

export const DictionaryHistory = mongoose.model("DictionaryHistory", dictionaryHistorySchema);

export async function prepareDictionaryHistoryStorage() {
  const collection = DictionaryHistory.collection;
  const collectionExists = await mongoose.connection.db
    .listCollections({ name: collection.collectionName })
    .hasNext();

  if (!collectionExists) {
    await DictionaryHistory.createCollection();
  }

  await collection.updateMany(
    { lookupDay: { $exists: false } },
    [
      {
        $set: {
          lookupDay: {
            $dateToString: {
              date: { $ifNull: ["$createdAt", "$updatedAt"] },
              format: "%Y-%m-%d",
              timezone: "Asia/Ho_Chi_Minh",
            },
          },
        },
      },
    ],
  );

  const indexes = await collection.indexes();
  const oldUniqueIndex = indexes.find((index) => index.name === "sessionId_1_normalizedQuery_1");
  if (oldUniqueIndex) await collection.dropIndex(oldUniqueIndex.name);

  await collection.createIndex(
    { sessionId: 1, normalizedQuery: 1, lookupDay: 1 },
    { name: "sessionId_1_normalizedQuery_1_lookupDay_1", unique: true },
  );
}
