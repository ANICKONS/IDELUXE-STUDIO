"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { months } from "@/features/account/format";
import { redeemPromoCode } from "@/lib/server/access";
import { consumeDailyQuota } from "@/lib/server/rate-limit";
import { getViewer } from "@/lib/server/session";

export type PromoState = { status: "idle" | "ok" | "error"; message: string };

/** Wrong guesses a day per account: codes can't be brute-forced. */
const ATTEMPTS_PER_DAY = 10;

const reasons = {
  invalid: "Такого промокода нет. Проверь, нет ли опечатки.",
  expired: "Срок действия промокода закончился.",
  used_up: "Этот промокод уже использован.",
  already: "Ты уже активировал этот промокод.",
} as const;

/** Profile → «Промокод»: adds the code's subscription period to the signed-in account. */
export async function redeemPromo(_prev: PromoState, form: FormData): Promise<PromoState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error", message: "Сессия закончилась: войди в аккаунт ещё раз." };
  if (!consumeDailyQuota(`promo:${viewer.user.id}`, ATTEMPTS_PER_DAY).allowed) {
    return { status: "error", message: "Слишком много попыток. Попробуй завтра." };
  }
  const code = String(form.get("code") ?? "").slice(0, 40);
  const result = redeemPromoCode(viewer.user.id, code);
  if (!result.ok) return { status: "error", message: reasons[result.reason] };

  // The account's pages show the new access right away
  revalidatePath(routes.profile);
  revalidatePath(routes.dashboard);
  return { status: "ok", message: `Готово: IDX ${result.kind.toUpperCase()} на ${months(result.months)}.` };
}
