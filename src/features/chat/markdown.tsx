import { Fragment, type ReactNode } from "react";

/**
 * Minimal, safe Markdown renderer for assistant replies.
 * Builds React elements (no innerHTML), supports: paragraphs, headings, lists, code blocks, `inline code`, **bold**, *italic*.
 */
export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trimStart().startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) code.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={blocks.length} className="my-2 overflow-x-auto rounded-xl border border-white/8 bg-black/40 p-3 font-mono text-[12px] leading-relaxed text-accent-soft">
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Lists
    const ordered = /^\s*\d+[.)]\s+/;
    const bullet = /^\s*[-*•]\s+/;
    if (ordered.test(line) || bullet.test(line)) {
      const isOrdered = ordered.test(line);
      const pattern = isOrdered ? ordered : bullet;
      const items: string[] = [];
      while (i < lines.length && pattern.test(lines[i])) items.push(lines[i++].replace(pattern, ""));
      const ListTag = isOrdered ? "ol" : "ul";
      blocks.push(
        <ListTag key={blocks.length} className={`my-2 space-y-1 pl-5 ${isOrdered ? "list-decimal" : "list-disc"} marker:text-accent`}>
          {items.map((item, k) => (
            <li key={k}>{inline(item)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    // Headings
    const heading = /^#{1,4}\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push(
        <p key={blocks.length} className="mt-3 mb-1 font-semibold text-fg">
          {inline(heading[1])}
        </p>,
      );
      i++;
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph: consecutive non-empty lines
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].trimStart().startsWith("```") && !ordered.test(lines[i]) && !bullet.test(lines[i]) && !/^#{1,4}\s/.test(lines[i])) {
      para.push(lines[i++]);
    }
    blocks.push(
      <p key={blocks.length} className="my-1.5">
        {para.map((p, k) => (
          <Fragment key={k}>
            {k > 0 && <br />}
            {inline(p)}
          </Fragment>
        ))}
      </p>,
    );
  }

  return <>{blocks}</>;
}

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("`")) {
      parts.push(
        <code key={parts.length} className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em] text-accent-soft">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      parts.push(
        <strong key={parts.length} className="font-semibold text-fg">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(<em key={parts.length}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
