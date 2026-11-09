import { Email } from "./Email";
export function DemoCredentials({ accounts }: { accounts: { label: string; email: string }[] }) {
  return (
    <details className="mt-6 text-sm text-gray-700 border border-gray-200 rounded-md p-3 bg-gray-50">
      <summary className="cursor-pointer font-medium">Demo credentials</summary>
      <ul className="mt-2 space-y-1">
        {accounts.map((a) => (
          <li key={a.email}>
            <span className="font-medium">{a.label}:</span> <code><Email value={a.email} /></code>
          </li>
        ))}
        <li>
          <span className="font-medium">Password (all accounts):</span> <code>password</code>
        </li>
      </ul>
    </details>
  );
}
