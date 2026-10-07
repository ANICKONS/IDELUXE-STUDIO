import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { ProfileView } from "@/features/account";
import { getViewer } from "@/lib/server/session";

export const metadata: Metadata = { title: "Профиль", robots: { index: false } };

/** The account's profile; without a valid session — the sign-in page (proxy.ts sends there too). */
export default async function ProfilePage() {
  const viewer = await getViewer();
  if (!viewer) redirect(routes.login);
  return <ProfileView viewer={viewer} />;
}
