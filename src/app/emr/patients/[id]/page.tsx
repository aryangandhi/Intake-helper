import { redirect } from "next/navigation";

export default async function Chart({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/emr/patients/${(await params).id}/documents`);
}
