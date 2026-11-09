import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { seedDemo } from "@/lib/seed";

// POST /api/reset restores all demo data (used by tests and scripts).
export async function POST() {
  await seedDemo(prisma);
  return NextResponse.json({ ok: true });
}
