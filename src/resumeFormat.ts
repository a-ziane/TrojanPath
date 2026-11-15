/** Shared structure keeps the document preview and PDF consistent without rewriting saved text. */
export function formatResume(text: string, fallbackName: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const name = lines.shift()?.trim() || fallbackName;
  const blocks: {
    kind: "contact" | "heading" | "body" | "bullet";
    text: string;
  }[] = [];
  let inHeader = true;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "Add confirmed experience to your profile.") continue;
    if (!line) {
      inHeader = false;
      continue;
    }
    const heading =
      /^[A-Z][A-Z\s&/—-]+$/.test(line.replace(/\s*\([^)]*\)/g, "")) &&
      line.length < 65;
    if (heading) inHeader = false;
    blocks.push({
      kind: heading
        ? "heading"
        : /^[•●\-]\s/.test(line)
          ? "bullet"
          : inHeader
            ? "contact"
            : "body",
      text: line.replace(/^[•●\-]\s+/, ""),
    });
  }
  return {
    name,
    blocks: blocks.filter(
      (block, index) =>
        block.kind !== "heading" ||
        (blocks[index + 1] && blocks[index + 1].kind !== "heading"),
    ),
  };
}
