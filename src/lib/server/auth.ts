import "server-only";
import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth, type GenericOAuthConfig } from "better-auth/plugins/generic-oauth";
import { env } from "@/config/env";
import { isGoogleConfigured, isMailConfigured, isTelegramConfigured, serverEnv } from "@/config/env.server";
import { getDb, migrateAppTables } from "@/lib/server/db";
import { sendResetPasswordMail, sendVerificationMail } from "@/lib/server/mail";

/*
 * Accounts: Better Auth on the site's SQLite file. Three ways in, each switched on by its keys
 * (without them the button on /login explains that it isn't connected):
 *  - email and password — always;
 *  - Telegram — GOOGLE-like OpenID Connect from @BotFather (TELEGRAM_CLIENT_ID/SECRET);
 *  - Google — GOOGLE_CLIENT_ID/SECRET.
 * Sessions live in the database, the browser holds an httpOnly cookie (Secure on https). Passwords
 * are hashed by Better Auth (scrypt). Sign-in, sign-up and the other auth endpoints are
 * rate-limited per IP (X-Real-IP from nginx).
 */

const DAY = 60 * 60 * 24;
const HOUR = 60 * 60;

/**
 * Telegram login over OpenID Connect (core.telegram.org/widgets/login): the old iframe widget with
 * an HMAC hash is retired. Client ID and Secret come from @BotFather → Login Widget, where the
 * callback must also be allowed: <site>/api/auth/callback/telegram.
 * Telegram gives no e-mail, so the account gets a technical one on `.invalid` (a domain reserved
 * by RFC 2606): nothing is ever sent there, and the person can be reached in Telegram.
 */
function telegramProvider(): GenericOAuthConfig {
  return {
    providerId: "telegram",
    name: "Telegram",
    discoveryUrl: "https://oauth.telegram.org/.well-known/openid-configuration",
    clientId: serverEnv.telegramClientId,
    clientSecret: serverEnv.telegramClientSecret,
    // `phone` is not asked for: a phone number would be personal data we have no use for
    scopes: ["openid", "profile"],
    // Identity comes from the id_token claims, so its signature must be verifiable
    requireIdTokenVerification: true,
    /*
     * The account key is the Telegram user id (claim `id`), not the internal `sub`: the bot knows
     * exactly this number, so it can grant access with it (api/internal/grant). Must never change
     * afterwards — it is what links purchases to the account.
     */
    accountSubject: ({ profile }) => String(profile.id ?? profile.sub),
    mapProfileToUser: (profile) => {
      const id = String(profile.id ?? profile.sub);
      const username = typeof profile.preferred_username === "string" ? profile.preferred_username : "";
      return {
        name: profile.name || username || `Монтажёр ${id.slice(-4)}`,
        image: typeof profile.picture === "string" ? profile.picture : undefined,
        email: `tg-${id}@telegram.invalid`,
        // There is nothing to confirm: Telegram itself vouches for the account
        emailVerified: true,
      };
    },
  };
}

function createAuth() {
  return betterAuth({
    appName: "IDELUXE STUDIO",
    baseURL: env.siteUrl,
    secret: serverEnv.authSecret || undefined,
    database: getDb(),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      /*
       * With mail set up the address must be confirmed before the first sign-in: otherwise someone
       * could take an address they don't own and catch the access a buyer later asks the bot to
       * grant by that e-mail. Without SMTP there is nothing to confirm with, so the account is
       * signed in right away.
       */
      requireEmailVerification: isMailConfigured(),
      autoSignIn: !isMailConfigured(),
      sendResetPassword: ({ user, url }) => sendResetPasswordMail({ to: user.email, url }),
      resetPasswordTokenExpiresIn: HOUR,
    },
    emailVerification: {
      sendVerificationEmail: ({ user, url }) => sendVerificationMail({ to: user.email, url }),
      sendOnSignUp: isMailConfigured(),
      // Confirmed from the letter — already signed in, no second trip to the form
      autoSignInAfterVerification: true,
      expiresIn: HOUR,
    },
    socialProviders: isGoogleConfigured()
      ? { google: { clientId: serverEnv.googleClientId, clientSecret: serverEnv.googleClientSecret, prompt: "select_account" } }
      : {},
    session: {
      expiresIn: 30 * DAY,
      // The expiry slides forward once a day while the account is in use
      updateAge: DAY,
    },
    rateLimit: {
      // In development too: the limits are part of what's being tested
      enabled: true,
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60 * 10, max: 5 },
      },
    },
    trustedOrigins: [env.siteUrl],
    advanced: {
      // nginx sets X-Real-IP to the real client; X-Forwarded-For can be forged by the client
      ipAddress: { ipAddressHeaders: ["x-real-ip"] },
    },
    plugins: [
      // Telegram is registered as an ordinary social provider: authClient.signIn.social("telegram")
      ...(isTelegramConfigured() ? [genericOAuth({ config: [telegramProvider()] })] : []),
      // Must stay last: lets server actions set the session cookie
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let ready: Promise<Auth> | undefined;

/**
 * The auth instance, with the database schema brought up to date on first use (Better Auth's tables,
 * then ours). Lazy, so `next build` neither opens the database nor needs the secret.
 */
export function getAuth(): Promise<Auth> {
  ready ??= (async () => {
    if (process.env.NODE_ENV === "production" && serverEnv.authSecret.length < 32) {
      throw new Error("BETTER_AUTH_SECRET must be set (32+ characters) in production");
    }
    const auth = createAuth();
    const { runMigrations } = await getMigrations(auth.options);
    await runMigrations();
    migrateAppTables(getDb());
    return auth;
  })().catch((error) => {
    // Let the next request try again instead of failing forever
    ready = undefined;
    throw error;
  });
  return ready;
}
