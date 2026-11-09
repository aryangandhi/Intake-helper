"use client";
import { useActionState } from "react";
import { iaLogin } from "../actions";

export function IaLoginForm() {
  const [err, action, pending] = useActionState(iaLogin, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">Work email</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="mt-1 w-full rounded-md border border-slate-400 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-md border border-slate-400 px-3 py-2" />
      </div>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <button disabled={pending} className="w-full rounded-md bg-ia-600 px-4 py-2 font-semibold text-white hover:bg-ia-700">Sign in</button>
    </form>
  );
}
