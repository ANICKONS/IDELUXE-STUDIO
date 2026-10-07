import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/server/auth";

/** Better Auth's endpoints: sign-up, sign-in, sign-out, session, OAuth callbacks (lib/server/auth.ts). */
const handler = async () => toNextJsHandler(await getAuth());

export async function GET(request: Request) {
  return (await handler()).GET(request);
}

export async function POST(request: Request) {
  return (await handler()).POST(request);
}
