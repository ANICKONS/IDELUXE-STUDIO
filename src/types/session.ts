/**
 * Signed-in user as the UI needs it (header, profile). V5 has no auth yet, so the layout passes
 * `null`; once auth is connected, map the provider's user to this shape on the server.
 */
export type SessionUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
};
