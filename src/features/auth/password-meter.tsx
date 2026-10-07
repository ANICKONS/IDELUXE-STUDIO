import { pluralRu } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Must match `emailAndPassword.minPasswordLength` in lib/server/auth.ts. */
export const MIN_PASSWORD = 8;

/** Password strength: 0 — empty, 1 — too short or one kind of characters … 4 — long and varied. */
function strength(password: string) {
  if (!password) return 0;
  if (password.length < MIN_PASSWORD) return 1;
  const kinds = [/[a-zа-яё]/, /[A-ZА-ЯЁ]/, /\d/, /[^\p{L}\d]/u].filter((re) => re.test(password)).length;
  return Math.min(4, 1 + (password.length >= 12 ? 1 : 0) + Math.max(0, kinds - 1));
}

const levels = [
  { bar: "", text: "text-dim" },
  { bar: "bg-rose", text: "text-rose" },
  { bar: "bg-amber", text: "text-amber" },
  { bar: "bg-sky", text: "text-sky" },
  { bar: "bg-teal", text: "text-teal" },
];

function label(password: string, level: number) {
  if (!password) return `Минимум ${MIN_PASSWORD} символов`;
  const left = MIN_PASSWORD - password.length;
  if (left > 0) return `Ещё ${left} ${pluralRu(left, ["символ", "символа", "символов"])}`;
  return ["", "Слабый: добавь цифры или заглавные", "Средний пароль", "Хороший пароль", "Надёжный пароль"][level];
}

/** Four bars and a caption under a new-password field: on sign-up and on password reset. */
export function PasswordMeter({ password, id, className }: { password: string; id?: string; className?: string }) {
  const level = strength(password);
  return (
    <div id={id} className={className}>
      <div aria-hidden className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", level >= i ? levels[level].bar : "bg-white/10")} />
        ))}
      </div>
      <p className={cn("mt-2 text-xs transition-colors", levels[level].text)}>{label(password, level)}</p>
    </div>
  );
}
