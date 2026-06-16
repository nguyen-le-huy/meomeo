import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

async function startServer() {
  try {
    await connectDB();
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
  }

  app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
}

startServer();
