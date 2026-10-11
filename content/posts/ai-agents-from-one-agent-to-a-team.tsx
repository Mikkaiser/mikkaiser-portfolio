import { CodeTabs } from "@/components/blog/CodeTabs";
import { A, Code, H2, Quote } from "@/components/blog/Prose";
import type { PostMeta, TocItem } from "@/lib/posts";
import { CODE } from "./ai-agents-from-one-agent-to-a-team.code";

export const meta: PostMeta = {
  slug: "ai-agents-from-one-agent-to-a-team",
  title: "AI Agents: From One Agent To A Team",
  summary: "Orchestration by code, agents as tools and handoffs, built on the same corner store in Python, TypeScript and C#.",
  lead: "Three ways to make agents work together, and the question each one leaves you to answer.",
  topic: "AI",
  date: "2026-10-11",
  minutes: 10,
  draft: true,
};

export const toc: TocItem[] = [
  { id: "by-code", label: "Orchestrated by code" },
  { id: "forced", label: "Forcing a tool call" },
  { id: "as-tools", label: "Agents as tools" },
  { id: "manager", label: "A manager that plans for itself" },
  { id: "handoffs", label: "Handoffs" },
  { id: "choosing", label: "Choosing between them" },
];

const REPO = "https://github.com/Mikkaiser/agentic-corner-store";
const PROMO = { py: "promo.py", ts: "promo.ts", cs: "Promo.cs" };
const SHOP = { py: "shop.py", ts: "shop.ts", cs: "Shop.cs" };

export default function Post() {
  return (
    <>
      <p>
        The <A href="/blog/ai-agents-from-llm-calls-to-loops">first post</A> built one agent for a corner store: a
        loop, two tools, memory and streaming. The second phase of the <A href={REPO}>exercise</A> asked for more. The
        owner wanted to hear about orders, to send a weekly promotion that was well written, and to stop depending on
        one agent that did everything. I built it in steps, and each step was a different way of making agents work
        together.
      </p>
      <p>
        The snippets reuse the store from the first post: the <Code>INVENTORY</Code> and the{" "}
        <Code>check_stock</Code> and <Code>get_price</Code> tools live in a small store module. As before, pick a
        language on any code card and the rest of the page follows.
      </p>

      <H2 id="by-code">Orchestrated by code</H2>
      <p>
        The weekly promo is not part of the chat. It is a script the owner runs, or a scheduler runs every Monday, and
        its steps never change: build a brief, get drafts, pick one, send it. When the steps are fixed, the simplest
        orchestration is plain code.
      </p>
      <CodeTabs {...CODE.c1} files={PROMO} />
      <p>
        Three writers get the same brief with a different style each: warm, witty and direct. They run at the same
        time, so the step takes as long as the slowest writer instead of all three added up. A picker agent then reads
        the drafts and replies with the best one, and nothing else. Your code decides the order of every step; the
        models only fill them in.
      </p>
      <p>
        The trace block puts the whole run under one name, so the dashboard shows the three writers overlapping and the
        picker after them. In C# the same picture comes from OpenTelemetry: start an activity around the block and
        build each agent with <Code>UseOpenTelemetry()</Code>, and the agent spans nest under it.
      </p>

      <H2 id="forced">Forcing a tool call</H2>
      <p>
        The last step sends the chosen promo to the owner. An agent with a <Code>notify_owner</Code> tool might do
        that, or it might reply with a friendly sentence about the promo and send nothing. For a step whose whole job
        is to call a tool, the tool call should not be optional.
      </p>
      <CodeTabs {...CODE.c2} files={PROMO} />
      <p>
        <Code>tool_choice=&quot;required&quot;</Code> makes the model call a tool on its first turn. It cannot stay
        required forever, or the agent would call tools until it hit the turn limit, so all three frameworks relax it
        after the first round of tool calls. The Agents SDKs do this through <Code>reset_tool_choice</Code>, which is
        on by default; in Agent Framework the function-calling layer always clears <Code>RequireAny</Code> after the
        first round. In the real exercise the tool sends a push notification, and falls back to a log file when the
        push service is not configured.
      </p>

      <H2 id="as-tools">Agents as tools</H2>
      <p>
        The chat agent from the first post did everything itself. In this step it became a Shopkeeper that talks to
        the customer and owns no function tools at all. Stock questions go to an Inventory Specialist and price
        questions to a Pricing Specialist, and the Shopkeeper calls each of them as if it were a function.
      </p>
      <CodeTabs {...CODE.c3} files={SHOP} />
      <p>
        Control goes out to the specialist and comes back: the Shopkeeper asks, the specialist runs its own loop with
        its own tools, and its final answer returns as the tool result. The Shopkeeper then writes the reply. In the
        trace, the specialists&rsquo; tool calls sit nested inside the Shopkeeper&rsquo;s.
      </p>
      <p>
        The tool description is the only thing the Shopkeeper knows about a specialist, so it carries an example of a
        good question. Two differences show up across the frameworks. Agent Framework names the input parameter{" "}
        <Code>query</Code> where the Agents SDKs say <Code>input</Code>, and by default it calls the two specialists
        one after the other where the Agents SDKs can run them at the same time.
      </p>

      <H2 id="manager">A manager that plans for itself</H2>
      <p>
        The same idea works for the promo. Instead of code calling the writers, a Promo Manager agent gets the three
        writers as tools, plus <Code>notify_owner</Code>, and a prompt with numbered steps: get a draft from each
        writer, choose the best one, send exactly one notification. No Python decides the order any more.
      </p>
      {/* TODO(Mikael): the exercise compared 2.2 and 2.3b over five runs each (notifications sent, spans, time,
          tokens). Add what your traces showed here. */}
      <p>
        That buys flexibility and costs certainty. The code version cannot send two notifications, because there is
        one line that sends it. The manager version sends exactly one because its prompt says so, and the trace is
        where you check that it listened. The <A href={REPO}>repository</A> has both versions side by side.
      </p>

      <H2 id="handoffs">Handoffs</H2>
      <p>
        The last step let customers place an order. A Checkout Agent got a <Code>place_order</Code> tool that lowers
        the stock and returns an order number, and the Shopkeeper got a handoff to it, with an instruction to use it
        only when the customer clearly wants to buy.
      </p>
      <CodeTabs {...CODE.c4} files={SHOP} />
      <p>
        A handoff is not a tool call that comes back. Control passes across: once the Shopkeeper hands off, the
        Checkout Agent finishes the turn and writes the final answer. That raises a question the framework leaves to
        you. When the customer sends the next message, which agent should answer it?
      </p>
      <Quote>Continuing with the last agent left customers stuck with the Checkout Agent.</Quote>
      <p>
        I tried both. Continuing with <Code>last_agent</Code> sounded natural, and it failed: the Checkout Agent has no
        stock or price tools, so it started inventing the answers it could not look up. Every
        turn in the chat now starts at the Shopkeeper, which can hand off again whenever the customer is ready to buy.
      </p>
      <p>
        Agent Framework arrives at the same place from a different direction. Handoffs there are edges in a workflow,
        built with <Code>WithHandoff</Code>, and the rule for when to hand off becomes the description of the handoff
        tool. Each run starts again at the first agent by default; continuing with the last one is an option you have
        to turn on.
      </p>

      <H2 id="choosing">Choosing between them</H2>
      <p>Each pattern fitted one job in the store well.</p>
      <ul>
        <li>
          <strong>Code</strong> fitted the promo, where the steps never change and the notification has to go out
          exactly once. It is the easiest to debug, and the least flexible.
        </li>
        <li>
          <strong>Agents as tools</strong> fitted the chat, where one agent keeps the conversation and asks specialists
          for facts. Control always comes back to the agent the customer is talking to.
        </li>
        <li>
          <strong>Handoffs</strong> fitted the checkout, where another agent should own the rest of the turn. The price
          is deciding, in your own code, who answers next.
        </li>
      </ul>
      <p>
        All three are the loop from the first post, wired together differently. When a team of agents misbehaves, the
        trace shows which loop made which decision, and that is where to start reading.
      </p>
    </>
  );
}
