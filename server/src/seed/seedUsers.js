import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { config } from "../config/env.js";
import { User } from "../modules/users/user.model.js";

async function seedDefaultUsers() {
  await connectDB();
  const seedUser = {
    name: "Admin",
    email: config.admin.email,
    username: config.admin.username,
    password: config.admin.password,
    role: "admin",
  };

  const email = seedUser.email.toLowerCase();
  const username = seedUser.username.toLowerCase();
  const existingUser = await User.findOne({ $or: [{ email }, { username }, { email: username }] });
  const passwordHash = await bcrypt.hash(seedUser.password, 10);

  if (existingUser) {
    existingUser.name = seedUser.name;
    existingUser.email = email;
    existingUser.username = username;
    existingUser.passwordHash = passwordHash;
    existingUser.role = seedUser.role;
    existingUser.isActive = true;
    await existingUser.save();
  } else {
    await User.create({
      name: seedUser.name,
      email,
      username,
      passwordHash,
      role: seedUser.role,
      isActive: true,
    });
  }

  await User.deleteMany({ role: "student" });

  console.log("Seed admin completed");
  console.log(`Admin account: ${username} / ${seedUser.password}`);
}

seedDefaultUsers()
  .catch((error) => {
    console.error(`Seed users failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
