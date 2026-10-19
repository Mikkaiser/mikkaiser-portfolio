/** One word of the article as the narration sees it: where it sits in the page, and its plain form for matching. */
export type NarrationWord = { node: Text; start: number; end: number; word: string };

/**
 * The words a narration can follow, in reading order. Popover panels, code
 * cards and screen reader text are left out, since nobody reads them aloud.
 * Each word is a range inside one text node, without the punctuation around it,
 * and `word` is its lowercase letters and digits only ("Let’s" → "lets").
 *
 * scripts/narration-sync.mjs runs this same function in the page to time the
 * words, so it must stay self-contained: no imports, no helpers outside it.
 */
export function narrationWords(root: Element): NarrationWord[] {
  const skip = ".cref, .code, .sr-only, [aria-hidden='true']";
  const words: NarrationWord[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(skip) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    for (const m of node.data.matchAll(/\S+/g)) {
      // Trim the quotes, brackets and punctuation around the word, so only the word lights up.
      const inner = m[0].match(/[\p{L}\p{N}](.*[\p{L}\p{N}])?/u);
      if (!inner || inner.index === undefined) continue;
      const start = m.index + inner.index;
      const word = inner[0].toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
      words.push({ node, start, end: start + inner[0].length, word });
    }
  }
  return words;
}
