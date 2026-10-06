"use client";

import { openChat } from "@/features/chat/events";

/** Opens the floating AI assistant from anywhere on the page. */
export function OpenChatButton({
  children,
  className,
  prompt,
}: {
  children: React.ReactNode;
  className?: string;
  prompt?: string;
}) {
  return (
    // data-chat-open: a press here isn't a "click outside" that would close the open chat
    <button type="button" data-chat-open className={className} onClick={() => openChat(prompt)}>
      {children}
    </button>
  );
}
