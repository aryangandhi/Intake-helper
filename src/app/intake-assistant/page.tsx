import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function IaHome() {
  const user = await requireUser("ia");
  redirect(user.role === "admin" ? "/intake-assistant/referrals" : user.role === "nurse" ? "/intake-assistant/notifications" : "/intake-assistant/upcoming");
}
