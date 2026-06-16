import app from "./app.js";
import { connectDB } from "./config/db.js";
import { config } from "./config/env.js";

async function startServer() {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
}

startServer();
