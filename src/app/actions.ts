"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { seedDemo } from "@/lib/seed";

export async function resetDemoAction() {
  await seedDemo(prisma);
  const store = await cookies();
  for (const c of store.getAll()) if (c.name.startsWith("proto_")) store.delete(c.name);
  redirect("/?reset=1");
}
