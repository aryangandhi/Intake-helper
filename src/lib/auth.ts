import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";

// Prototype-only auth: each simulated system keeps its own cookie with the user id,
// so logging in to one system does not log you in to the others.
export type SystemKey = "inbox" | "mcc" | "ia" | "emr";

const COOKIE: Record<SystemKey, string> = { inbox: "proto_inbox", mcc: "proto_mcc", ia: "proto_ia", emr: "proto_emr" };
const LOGIN: Record<SystemKey, string> = {
  inbox: "/inbox",
  mcc: "/myconnectedcare/login",
  ia: "/intake-assistant/login",
  emr: "/emr/login",
};
export const ALLOWED_ROLES: Record<SystemKey, string[]> = {
  inbox: ["patient"],
  mcc: ["patient"],
  ia: ["admin", "nurse", "coop"],
  emr: ["nurse", "oncologist"],
};

/** Demo flag: DISABLE_LOGIN=true in .env skips password screens. */
export const LOGIN_DISABLED = process.env.DISABLE_LOGIN === "true";

// Who you are by default in each system when login is disabled.
// Intake Assistant has no default: it shows a one-click role picker instead.
export const DEFAULT_EMAIL: Partial<Record<SystemKey, string>> = {
  inbox: "jane.doe@example.com",
  mcc: "jane.doe@example.com",
  emr: "oncologist@wrhn-demo.ca",
};

export async function currentUser(system: SystemKey, opts: { noDefault?: boolean } = {}) {
  const store = await cookies();
  const id = store.get(COOKIE[system])?.value;
  const inboxEmail = system === "mcc" ? store.get("proto_inbox")?.value : undefined;
  const fallback = LOGIN_DISABLED && !opts.noDefault ? inboxEmail || DEFAULT_EMAIL[system] : undefined;
  if (!id && !fallback) return null;
  const user = id
    ? await prisma.user.findUnique({ where: { id }, include: { referral: true } })
    : await prisma.user.findUnique({ where: { email: fallback }, include: { referral: true } });
  if (!user || !ALLOWED_ROLES[system].includes(user.role)) {
    // Demo mode: the inbox patient may not have a portal account yet; fall back to Jane.
    if (!id && inboxEmail && DEFAULT_EMAIL[system]) return prisma.user.findUnique({ where: { email: DEFAULT_EMAIL[system] }, include: { referral: true } });
    return null;
  }
  return user;
}

export async function requireUser(system: SystemKey, roles?: string[]) {
  const user = await currentUser(system);
  if (!user) redirect(LOGIN[system]);
  if (roles && !roles.includes(user.role)) redirect(system === "ia" ? "/intake-assistant" : LOGIN[system]);
  return user;
}

export async function setSession(system: SystemKey, userId: string) {
  const store = await cookies();
  store.set(COOKIE[system], userId, { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function clearSession(system: SystemKey) {
  const store = await cookies();
  store.delete(COOKIE[system]);
}

/** Returns an error message, or null and sets the session. */
export async function login(system: SystemKey, email: string, password: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || user.password !== password) return "That email or password is not correct.";
  if (!ALLOWED_ROLES[system].includes(user.role)) return "This account does not have access to this system.";
  await setSession(system, user.id);
  return null;
}

/** One-click login used by the role picker when login is disabled. */
export async function quickLogin(system: SystemKey, email: string): Promise<boolean> {
  if (!LOGIN_DISABLED) return false;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !ALLOWED_ROLES[system].includes(user.role)) return false;
  await setSession(system, user.id);
  return true;
}
