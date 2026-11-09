import { requireUser } from "@/lib/auth";
import { MccShell } from "@/components/MccShell";
import { questionnaireBadge } from "@/lib/mcc";

export const dynamic = "force-dynamic";
export const metadata = { title: "MyConnectedCare (prototype): Messages" };

export default async function Messages() {
  const user = await requireUser("mcc");
  return (
    <MccShell active="messages" name={user.name} badge={{ questionnaires: await questionnaireBadge(user.referralId) }}>
      <h1 className="text-3xl font-bold text-mcc-900">Messages</h1>
      <p className="mt-6 text-lg text-gray-800">You have no messages. (Messaging is not part of this prototype.)</p>
    </MccShell>
  );
}
