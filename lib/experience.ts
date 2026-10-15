/** The year Mikael started programming. Every "years of experience" on the site counts from here. */
export const STARTED_CODING = 2020;

/** Whole calendar years since then, so it moves on its own every January. */
export function yearsCoding(now: Date = new Date()): number {
  return now.getFullYear() - STARTED_CODING;
}

const WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];

/** The count as a word for running text ("six"), or digits past twenty. */
export function yearsCodingWord(now: Date = new Date()): string {
  const n = yearsCoding(now);
  return WORDS[n] ?? String(n);
}

/** The same, capitalised for the start of a sentence ("Six"). */
export function yearsCodingWordCap(now: Date = new Date()): string {
  const w = yearsCodingWord(now);
  return w.charAt(0).toUpperCase() + w.slice(1);
}
