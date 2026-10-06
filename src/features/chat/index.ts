/**
 * AI assistant: floating widget (client) + /api/chat (server, see src/app/api/chat/route.ts).
 * Server-only parts (prompt) are imported directly from their files, not through this barrel.
 */
export { ChatWidget } from "@/features/chat/chat-widget";
export { OpenChatButton } from "@/features/chat/open-chat-button";
