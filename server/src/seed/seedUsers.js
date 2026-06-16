import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../modules/users/user.model.js";

const seedUsers = [
  {
    name: "Admin",
    email: "admin",
    password: "1234567",
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

    if (existingUser) {
      continue;
    }

    const passwordHash = await bcrypt.hash(seedUser.password, 10);

    await User.create({
      name: seedUser.name,
      email,
      passwordHash,
      role: seedUser.role,
      isActive: true,
    });
  }

  console.log("Seed users completed");
  console.log("Admin account: admin / 1234567");
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
