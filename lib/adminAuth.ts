import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_SESSION_COOKIE = "popped-admin-session";
const ADMIN_SESSION_COOKIE_PATH = "/";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type AdminSessionPayload = {
  email: string;
  expiresAt: number;
};

export type AdminSession = {
  email: string;
  expiresAt: Date;
};

export type AdminSignInResult =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid" | "not_configured" };

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  return verifySessionCookie(sessionCookie.value);
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin");
  }

  return session;
}

export async function signInAdmin(
  email: string,
  password: string,
): Promise<AdminSignInResult> {
  if (!hasAdminAuthConfig()) {
    return { ok: false, reason: "not_configured" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (
    !getAllowedAdminEmails().includes(normalizedEmail) ||
    !secureCompare(password, process.env.ADMIN_PASSWORD ?? "")
  ) {
    return { ok: false, reason: "invalid" };
  }

  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionCookieValue({
    email: normalizedEmail,
    expiresAt,
  }), {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
    path: ADMIN_SESSION_COOKIE_PATH,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return { ok: true, email: normalizedEmail };
}

export async function signOutAdmin(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: ADMIN_SESSION_COOKIE_PATH,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function getAdminAuthConfigStatus() {
  return {
    hasAllowedEmails: getAllowedAdminEmails().length > 0,
    hasPassword: Boolean(process.env.ADMIN_PASSWORD),
    hasSessionSecret: Boolean(process.env.ADMIN_SESSION_SECRET),
  };
}

function hasAdminAuthConfig() {
  const status = getAdminAuthConfigStatus();

  return (
    status.hasAllowedEmails &&
    status.hasPassword &&
    status.hasSessionSecret
  );
}

function createSessionCookieValue(payload: AdminSessionPayload) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifySessionCookie(value: string): AdminSession | null {
  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature || !secureCompare(signature, signValue(encodedPayload))) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<AdminSessionPayload>;

    if (
      typeof payload.email !== "string" ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Date.now() ||
      !getAllowedAdminEmails().includes(payload.email)
    ) {
      return null;
    }

    return {
      email: payload.email,
      expiresAt: new Date(payload.expiresAt),
    };
  } catch {
    return null;
  }
}

function signValue(value: string) {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "")
    .update(value)
    .digest("base64url");
}

function secureCompare(value: string, expectedValue: string) {
  const valueHash = createHash("sha256").update(value).digest();
  const expectedHash = createHash("sha256").update(expectedValue).digest();

  return timingSafeEqual(valueHash, expectedHash);
}

function getAllowedAdminEmails() {
  return (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}
