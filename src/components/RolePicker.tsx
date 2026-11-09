// Shown instead of the password form when DISABLE_LOGIN=true.
export function RolePicker({ accounts, action, buttonClass }: { accounts: { label: string; email: string }[]; action: (email: string) => Promise<void>; buttonClass: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-700">Choose who you are (demo mode, no password needed).</p>
      {accounts.map((a) => (
        <form key={a.email} action={action.bind(null, a.email)}>
          <button className={`w-full ${buttonClass}`}>Continue as {a.label}</button>
        </form>
      ))}
    </div>
  );
}
