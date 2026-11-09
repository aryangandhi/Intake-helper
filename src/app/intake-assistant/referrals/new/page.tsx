import { requireUser } from "@/lib/auth";
import { IaShell, PageTitle } from "@/components/IaShell";
import { ReferralForm } from "./ReferralForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Intake Assistant: New referral" };

export default async function NewReferral() {
  const user = await requireUser("ia", ["admin", "nurse"]);
  return (
    <IaShell user={user} active="referrals">
      <PageTitle title="New referral" sub="Enter the patient's details and first appointment." />
      <ReferralForm />
    </IaShell>
  );
}
