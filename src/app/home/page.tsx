import type { Metadata } from "next";
import { Dashboard } from "@/features/account";
import { LandingPage } from "@/features/landing";
import { getViewer } from "@/lib/server/session";

/*
 * «Моя студия». Visitors don't come here by this URL: proxy.ts serves it at "/" to anyone with a
 * session cookie. The session is checked here for real; if it has expired, the visitor simply
 * gets the landing, like any guest.
 */

export async function generateMetadata(): Promise<Metadata> {
  return (await getViewer()) ? { title: "Моя студия", robots: { index: false } } : {};
}

export default async function AccountHomePage() {
  const viewer = await getViewer();
  return viewer ? <Dashboard viewer={viewer} /> : <LandingPage />;
}
