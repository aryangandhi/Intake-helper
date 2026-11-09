"use client";
import { useActionState } from "react";
import { mccLogin, mccSignup } from "../actions";

const input = "mt-1 w-full rounded-lg border-2 border-gray-500 px-3 py-3 text-lg";
const btn = "w-full rounded-lg bg-mcc-700 px-4 py-3 text-lg font-bold text-white hover:bg-mcc-800 disabled:opacity-60";

export function LoginForm() {
  const [err, action, pending] = useActionState(mccLogin, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="block font-semibold">Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" className={input} />
      </div>
      <div>
        <label htmlFor="password" className="block font-semibold">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={input} />
      </div>
      {err && <p role="alert" className="font-medium text-red-700">{err}</p>}
      <button disabled={pending} className={btn}>Log in</button>
    </form>
  );
}

export function SignupForm() {
  const [err, action, pending] = useActionState(mccSignup, null);
  return (
    <form action={action} className="space-y-4">
      <p className="text-gray-800">Use the email address the Cancer Centre sent your invitation to.</p>
      <div>
        <label htmlFor="su-email" className="block font-semibold">Email</label>
        <input id="su-email" name="email" type="email" required className={input} />
      </div>
      <div>
        <label htmlFor="su-dob" className="block font-semibold">Date of birth</label>
        <input id="su-dob" name="dob" type="date" required className={input} />
      </div>
      <div>
        <label htmlFor="su-password" className="block font-semibold">Create a password</label>
        <input id="su-password" name="password" type="password" required minLength={6} autoComplete="new-password" className={input} />
      </div>
      <div>
        <label htmlFor="su-confirm" className="block font-semibold">Confirm password</label>
        <input id="su-confirm" name="confirm" type="password" required autoComplete="new-password" className={input} />
      </div>
      {err && <p role="alert" className="font-medium text-red-700">{err}</p>}
      <button disabled={pending} className={btn}>Create account</button>
    </form>
  );
}
