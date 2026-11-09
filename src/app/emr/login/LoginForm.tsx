"use client";
import { useActionState } from "react";
import { emrLogin } from "../actions";

export function EmrLoginForm() {
  const [err, action, pending] = useActionState(emrLogin, null);
  return (
    <form action={action} className="space-y-3 text-sm">
      <div>
        <label htmlFor="email" className="block font-medium">User name (email)</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="mt-1 w-full border border-gray-500 px-2 py-1.5" />
      </div>
      <div>
        <label htmlFor="password" className="block font-medium">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="mt-1 w-full border border-gray-500 px-2 py-1.5" />
      </div>
      {err && <p role="alert" className="text-red-700">{err}</p>}
      <button disabled={pending} className="w-full bg-emr-600 px-3 py-2 font-semibold text-white hover:bg-emr-700">Log in</button>
    </form>
  );
}
