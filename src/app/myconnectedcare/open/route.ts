import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { DEMO_PASSWORD } from "@/lib/seed";

// Relative redirect. Building an absolute URL from req.url points at localhost when the app is opened
// through a tunnel or from another laptop, which made the email button fail with "site can't be reached".
function redirectTo(path: string) {
  return new NextResponse(null, { status: 307, headers: { Location: path } });
}

// Demo shortcut: the "Open MyConnectedCare" button in the intake email links here with the referral id.
// It signs the patient straight in to the portal (creating their account if they don't have one yet),
// so testers don't have to log in a second time.
export async function GET(req: NextRequest) {
  const refId = req.nextUrl.searchParams.get("ref") || "";
  const ref = refId ? await prisma.referral.findUnique({ where: { id: refId } }) : null;
  if (!ref) return redirectTo("/myconnectedcare/login");

  let user = await prisma.user.findFirst({ where: { referralId: ref.id } });
  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email: ref.email } });
    user = byEmail
      ? await prisma.user.update({ where: { id: byEmail.id }, data: { referralId: ref.id, name: `${ref.firstName} ${ref.lastName}` } })
      : await prisma.user.create({ data: { email: ref.email, password: DEMO_PASSWORD, name: `${ref.firstName} ${ref.lastName}`, role: "patient", referralId: ref.id } });
  }
  await setSession("mcc", user.id);
  return redirectTo("/myconnectedcare");
}
