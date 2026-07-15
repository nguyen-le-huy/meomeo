import app from "./app.js";
import { connectDB } from "./config/db.js";
import { config } from "./config/env.js";
import { prepareDictionaryHistoryStorage } from "./modules/dictionary/dictionaryHistory.model.js";

async function startServer() {
  await connectDB();
  await prepareDictionaryHistoryStorage();

  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
}

startServer();
