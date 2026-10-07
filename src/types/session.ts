/**
 * Signed-in user as the UI needs it (header, profile, home). Shared by the server (lib/server/session.ts)
 * and the browser (lib/viewer.ts → /api/me).
 */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

/** What the account has paid for (content/plans.ts explains the plans). */
export type Tier = "free" | "lite" | "pro";

export type AccessInfo = {
  /** The best active subscription. PRO includes everything LITE has. */
  tier: Tier;
  /** Owns IDX PACK (bought on its own or within IDX FULL). */
  pack: boolean;
  /** End of the active period, ms since epoch; null — not active. */
  liteUntil: number | null;
  proUntil: number | null;
  /** Owner / testers (ADMIN_EMAILS): everything is open. */
  admin: boolean;
};

export type Viewer = { user: SessionUser; access: AccessInfo };
