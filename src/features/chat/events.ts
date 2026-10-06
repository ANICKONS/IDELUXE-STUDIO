export const OPEN_CHAT_EVENT = "idx:open-chat";

export type OpenChatDetail = { prompt?: string };

/** Opens the floating assistant from anywhere (optionally with a prefilled question). */
export function openChat(prompt?: string) {
  window.dispatchEvent(new CustomEvent<OpenChatDetail>(OPEN_CHAT_EVENT, { detail: { prompt } }));
}
