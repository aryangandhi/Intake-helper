import { prisma } from "./db";
import { buildRawData, flatRaw, parseAnswers } from "./answers";

/** Allergy line for the EMR banner, from the latest submission in the chart. */
export async function bannerAllergies(referralId: string): Promise<string> {
  const doc = await prisma.eMRDocument.findFirst({ where: { referralId }, orderBy: { createdAt: "desc" }, include: { submission: true, referral: true } });
  if (!doc) return "Not recorded";
  const raw = flatRaw(buildRawData(parseAnswers(doc.submission.answers), doc.referral, "staff"));
  const list = raw.find((r) => r.field_id === "al_list")?.answer;
  if (list) return list;
  return raw.find((r) => r.field_id === "al_has")?.answer === "No" ? "No known allergies" : "Not recorded";
}
