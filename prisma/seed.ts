import { PrismaClient } from "@prisma/client";
import { seedDemo } from "../src/lib/seed";

const prisma = new PrismaClient();
seedDemo(prisma)
  .then(() => console.log("Demo data loaded."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
