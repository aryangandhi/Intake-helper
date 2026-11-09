import { INTAKE_EMAIL_HTML, INTAKE_EMAIL_SUBJECT } from "@/content/intakeEmail";
import { prisma } from "./db";
import { formatDate, formatDateTime } from "./answers";

function fill(t: string, vars: Record<string, string>) {
  return t.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

export function renderIntakeEmail(r: { id: string; firstName: string; appointmentAt: Date }) {
  const vars = {
    firstName: r.firstName,
    date: formatDate(r.appointmentAt),
    dateTime: formatDateTime(r.appointmentAt),
    portalUrl: `/myconnectedcare/open?ref=${r.id}`,
    helpUrl: `/intake-assistant/request-help?ref=${r.id}`,
    exampleUrl: "/myconnectedcare/example",
  };
  return { subject: fill(INTAKE_EMAIL_SUBJECT, vars), bodyHtml: fill(INTAKE_EMAIL_HTML, vars) };
}

/** "Sends" the intake email into the simulated inbox. */
export async function sendIntakeEmail(referralId: string, at = new Date()) {
  const r = await prisma.referral.findUniqueOrThrow({ where: { id: referralId } });
  const { subject, bodyHtml } = renderIntakeEmail(r);
  await prisma.email.create({ data: { to: r.email, subject, bodyHtml, referralId: r.id, sentAt: at } });
  await prisma.referral.update({
    where: { id: r.id },
    data: { emailSentAt: at, status: r.status === "referral_entered" ? "email_sent" : r.status },
  });
}

export const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
