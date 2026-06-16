import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../modules/users/user.model.js";

const seedUsers = [
  {
    name: "Admin",
    email: "admin",
    password: "123456",
    role: "admin",
  },
  {
    name: "Meomeo",
    email: "meomeo",
    password: "123456",
    role: "student",
  },
];

async function seedDefaultUsers() {
  await connectDB();

  for (const seedUser of seedUsers) {
    const email = seedUser.email.toLowerCase();
    const existingUser = await User.findOne({ email });
    const passwordHash = await bcrypt.hash(seedUser.password, 10);

    if (existingUser) {
      existingUser.name = seedUser.name;
      existingUser.passwordHash = passwordHash;
      existingUser.role = seedUser.role;
      existingUser.isActive = true;
      await existingUser.save();
      continue;
    }

    await User.create({
      name: seedUser.name,
      email,
      passwordHash,
      role: seedUser.role,
      isActive: true,
    });
  }

  console.log("Seed users completed");
  console.log("Admin account: admin / 123456");
  console.log("Student account: meomeo / 123456");
}

seedDefaultUsers()
  .catch((error) => {
    console.error(`Seed users failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
