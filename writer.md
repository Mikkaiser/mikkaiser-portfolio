# How Mikael writes

This is my reading of how Mikael likes to write and explain things. I worked it out from the changes he asked
for while building the AI agents post, not from a style guide he wrote. Treat it as a working description: when
he corrects something, update this file.

Read it before writing or editing anything: blog posts, code samples and their comments, site copy, READMEs,
commit messages.

## The goal: the reader learns the concept

Mikael doesn't write to sound smart. He writes so the reader understands, and can explain it back. Every
choice below follows from that.

- Explain things the simplest way possible, as if for a curious kid. Simple words, short sentences, one idea
  at a time.
- Simple is not sloppy. The tone stays professional, and every fact, name and number is exact. The simplicity
  is in the words, never in the accuracy.
- Warm and casual, first person, like talking to a friend who is smart but new to the topic.
- Some fun, not a comedy set. A silly joke or a playful line now and then ("less superhero, more very smart pen
  pal", a spy in sunglasses). It should help the idea stick. Never two jokes in a row, never one at the reader's
  expense.
- Never formal. No essay or press release phrasing. If a sentence sounds like a LinkedIn post, rewrite it.

## How he builds an explanation

1. **Start from the context the reader already lives in.** Open with what changed in the world (a couple of
   years ago these words were not common, now everyone says them), not with a definition.
2. **Name the confusion.** Say that people use the word loosely and mix the concepts, then pin down one
   meaning before building on it. He wants a consistent, formal definition, said in plain words.
3. **Kill the myth early.** Where readers tend to get the wrong idea (the model has a superpower to act on your
   software), say it out loud and correct it. The model only receives text and returns text. Your code does
   the doing.
4. **Say what it is in one plain sentence, then picture it, then show the real thing.** An everyday picture
   first (the corner store), the exact term and the code after.
5. **Explain a jargon word the first time it shows up**, with a short pop-up (`Term`), then use it freely.
6. **Say why a piece is there, at the place it appears.** When a line of code or a step exists for a reason
   that isn't obvious (the step limit), explain the reason in a short paragraph just before the code. Don't
   leave the reader wondering why it's there.
7. **Show what the code does.** Under a code card, show a concrete result (what it prints, the conversation it
   produces), and for dense code an "In plain words" box so a reader who skips the code still follows.

## Short beats long

He trims. When something feels long, he says so ("too long"), and the answer is fewer, tighter paragraphs, not
a new heading.

- Cut repetition: say a thing once, in the place it belongs. Don't define the same word again two paragraphs
  later.
- Keep every idea, shorten the words around it.
- An intro earns its place by getting the reader to the point fast.
- Before adding a paragraph, check whether an earlier one already says it.

## Code samples

- **Happy path always.** No input validation, no defensive checks, no error handling unless it is crucial, or
  every implementation of that topic includes it by default. Teach the idea first. The post can say "a real
  version would check this" in one sentence.
- Keep what the concept needs, even if it isn't pure happy path (the step limit stays, because every agent loop
  needs a brake), and explain why it's there.
- **Simple is not short.** Shorter code is not simpler code. Prefer plain, obvious lines over clever compact
  ones: no walrus operators, nested one-liners or long `and` chains. One step per line, a name for each
  in-between value, and no line that runs off the card. Cut a concept the section doesn't need (an id map, a
  type check) before squeezing it into fewer lines.
- **Comments help, a few of them.** Two or three one-line comments per sample, placed where a new reader would
  ask "what is this for?". Say what a step is for, not what the syntax does. Never comment every line.
- Short, real, and runnable. Use the same names across Python, TypeScript and C#, with a real filename in each
  tab. Check that the code compiles or runs before publishing it.

## Words and format

- Post titles: Title Case on every word, colons allowed ("AI Agents: From LLM Calls To Loops").
- Headings inside a post: sentence case.
- No em dashes. Use a colon, a full stop, a comma or brackets.
- Avoid stock phrases that sound written for effect, like "the catch is...". Say it the way he would say it out loud
  ("but", "one thing to watch"), and don't lean on any single expression more than once or twice in a post.
- His role is always "Software Engineer & Tech Educator", written exactly like that.
- Numbers and units are exact. Prices, limits and versions are checked, never guessed.
- Text is sized to be comfortable to read, not to match a spec. Body text is 17px, a step above Acta. If
  something reads small, make it bigger.
- Follow Acta for everything it covers: https://mikkaiser.github.io/acta-design-system/

## How he works with me

- He gives me his own ideas in his own rough words ("the model only returns text, it receives text and
  generates text based on token consumption"). Keep his meaning and his order. Smooth the wording, and fix it
  if it isn't accurate (for example, I said each token is chosen from everything before it), and tell him what
  I changed.
- He reviews the rendered page and reacts to what he sees. Look at the result in a browser before saying it's
  done.
- He prefers a small, clear change to a big rewrite. If the request is ambiguous, pick the most likely meaning,
  say which one I picked, and offer the other.
- Commit and push each finished change to `main`, with no AI attribution.

## Check before handing back

- Could a smart 12-year-old follow every sentence?
- Is every technical word explained the first time?
- Is it still correct for an engineer reading it?
- Does it sound like a person, not a textbook?
- Is anything said twice? Is any paragraph there only because it was easy to write?
- Does the code show only what the concept needs?
- No em dashes, titles in Title Case, role written as on the portfolio.
