"use client";
import { useActionState } from "react";
import { inboxLogin } from "./actions";

export function InboxLoginForm() {
  const [err, action, pending] = useActionState(inboxLogin, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="block font-medium">Email address</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-lg" />
      </div>
      <div>
        <label htmlFor="password" className="block font-medium">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-lg" />
      </div>
      {err && <p role="alert" className="text-red-700">{err}</p>}
      <button disabled={pending} className="w-full rounded-md bg-blue-700 px-4 py-2 text-lg font-semibold text-white hover:bg-blue-800">Sign in</button>
    </form>
  );
}
