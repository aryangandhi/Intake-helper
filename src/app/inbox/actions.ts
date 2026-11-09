"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { DEMO_PASSWORD } from "@/lib/seed";

// The simulated webmail is separate from MyConnectedCare: any referred patient's email address
// works here with the demo password, even before they have a portal account.
export async function inboxLogin(_: string | null, fd: FormData) {
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const ref = await prisma.referral.findFirst({ where: { email } });
  if (!ref || password !== DEMO_PASSWORD) return "That email or password is not correct.";
  const store = await cookies();
  store.set("proto_inbox", email, { httpOnly: true, sameSite: "lax", path: "/" });
  store.delete("proto_mcc"); // the portal follows whichever patient is reading their email

  redirect("/inbox");
}

export async function inboxLogout() {
  (await cookies()).delete("proto_inbox");
  redirect("/inbox");
}

export async function markRead(id: string) {
  await prisma.email.update({ where: { id }, data: { read: true } });
}
