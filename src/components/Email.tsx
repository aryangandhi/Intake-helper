// Shows an email address with the "@" in its own span. A Cloudflare tunnel rewrites
// plain-text email addresses in the HTML, which breaks React hydration; splitting the
// address stops that, and copy-paste still gives the full address.
export function Email({ value }: { value: string }) {
  if (!value.includes("@")) return <>{value}</>;
  return (
    <>
      {value.split(/(@)/).map((part, i) => (part === "@" ? <span key={i}>@</span> : part))}
    </>
  );
}
