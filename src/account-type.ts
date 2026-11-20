// Helpers for business and user account types in the browser.
//
// The server is the source of truth: /api/auth/me returns `accountType`, and the
// database locks it once chosen. Everything here only decides where to send people
// and what to show; the server refuses the wrong area regardless.
import type { AccountProfile, AccountType } from "../server/account-types";

export type { AccountType };

/**
 * The type picked on the sign-up screen, kept until the account is signed in and
 * the type is saved. Stored in localStorage so it survives the email confirmation
 * link and the Google redirect (when they open in the same browser).
 */
const PENDING_KEY = "two-hands-account-type-choice";

export function savePendingAccountType(type: AccountType) {
  try {
    localStorage.setItem(PENDING_KEY, type);
  } catch {
    /* Storage can be blocked; the chooser screen asks again in that case. */
  }
}
export function readPendingAccountType(): AccountType | null {
  try {
    const value = localStorage.getItem(PENDING_KEY);
    return value === "business" || value === "user" ? value : null;
  } catch {
    return null;
  }
}
export function clearPendingAccountType() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* Nothing to clear. */
  }
}

/** Which signed-in area a hash route belongs to. */
export function areaOf(hash: string): "user" | "business" | "admin" | "other" {
  const page = hash.replace(/^#/, "").split("/")[0];
  if (page === "dashboard") return "user";
  if (page === "company") return "business";
  if (
    page === "" ||
    page === "home" ||
    page === "settings" ||
    page === "signin"
  )
    return "other";
  return "admin";
}

/** Where an account lands after signing in. */
export function homeRoute(profile: AccountProfile): string {
  if (profile.isAdmin) return "#admin";
  return profile.accountType === "business" ? "#company" : "#dashboard";
}

/**
 * Whether this account may open the area a route belongs to. Admins may open
 * every area; business accounts only the company area; user accounts only the
 * user dashboard. Shared pages (landing, settings) are open to everyone.
 */
export function canOpen(profile: AccountProfile, hash: string): boolean {
  const area = areaOf(hash);
  if (profile.isAdmin || profile.canPreview || area === "other") return true;
  if (area === "admin") return false;
  return profile.accountType === area;
}

/** The pick shown on the sign-up screen: business when heading to the company area. */
export function defaultAccountType(returnRoute: string): AccountType {
  return areaOf(returnRoute) === "business" ? "business" : "user";
}
