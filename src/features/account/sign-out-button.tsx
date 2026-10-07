"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { routes } from "@/config/routes";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/** Ends the session, then reloads at "/" (the landing again). */
export function SignOutButton({ className }: { className?: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        window.location.assign(routes.home);
      }}
      className={cn("btn btn-glass btn-md", className)}
    >
      <LogOut size={16} /> {pending ? "Выходим…" : "Выйти"}
    </button>
  );
}
