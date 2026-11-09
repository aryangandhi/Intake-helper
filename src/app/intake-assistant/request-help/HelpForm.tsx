"use client";
import { useActionState } from "react";
import { submitHelpRequest } from "../actions";

type Prefill = { name: string; dob: string; phone: string; language: string };
const input = "mt-1 w-full rounded-lg border-2 border-gray-500 px-3 py-3 text-lg";

export function HelpForm({ prefill, refId, from }: { prefill: Prefill; refId: string; from: string }) {
  const [err, action, pending] = useActionState(submitHelpRequest, null);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="ref" value={refId} />
      <input type="hidden" name="from" value={from} />
      <div>
        <label htmlFor="name" className="block text-lg font-semibold">Your full name</label>
        <input id="name" name="name" required defaultValue={prefill.name} className={input} />
      </div>
      <div>
        <label htmlFor="dob" className="block text-lg font-semibold">Date of birth</label>
        <input id="dob" name="dob" type="date" required defaultValue={prefill.dob} className={input} />
      </div>
      <div>
        <label htmlFor="phone" className="block text-lg font-semibold">Phone number we should call</label>
        <input id="phone" name="phone" type="tel" required defaultValue={prefill.phone} className={input} />
      </div>
      <div>
        <label htmlFor="language" className="block text-lg font-semibold">Preferred language</label>
        <input id="language" name="language" defaultValue={prefill.language} placeholder="English" className={input} />
      </div>
      <fieldset>
        <legend className="text-lg font-semibold">Best time to call</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {["Morning (9 to 12)", "Afternoon (12 to 5)", "Evening (5 to 7)", "Any time"].map((t, i) => (
            <label key={t} className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-gray-400 px-4 py-3 text-lg has-[:checked]:border-teal-700 has-[:checked]:bg-teal-50">
              <input type="radio" name="bestTime" value={t} defaultChecked={i === 3} className="h-5 w-5 accent-teal-700" />
              {t}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="notes" className="block text-lg font-semibold">
          Anything else we should know? <span className="font-normal text-gray-700">(optional)</span>
        </label>
        <textarea id="notes" name="notes" rows={3} className={input} />
      </div>
      {err && <p role="alert" className="text-lg font-medium text-red-700">{err}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-teal-800 px-5 py-3 text-xl font-bold text-white hover:bg-teal-900 disabled:opacity-60">
        Request a nurse call
      </button>
    </form>
  );
}
