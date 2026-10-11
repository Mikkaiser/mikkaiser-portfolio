import { CodeTabs } from "@/components/blog/CodeTabs";
import { A, Code, H2, Quote } from "@/components/blog/Prose";
import type { PostMeta, TocItem } from "@/lib/posts";
import { CODE } from "./ai-agents-from-llm-calls-to-loops.code";

export const meta: PostMeta = {
  slug: "ai-agents-from-llm-calls-to-loops",
  title: "AI Agents: From LLM Calls To Loops",
  summary: "Building a corner store agent by hand in Python, TypeScript and C#, then rebuilding it with a framework.",
  lead: "An agent is a model call inside a loop. Write that loop by hand once and every framework becomes easy to read.",
  topic: "AI",
  date: "2026-10-11",
  minutes: 11,
  draft: true,
};

export const toc: TocItem[] = [
  { id: "one-call", label: "A single call" },
  { id: "tools", label: "Giving the model tools" },
  { id: "loop", label: "The loop" },
  { id: "details", label: "The details that keep it working" },
  { id: "framework", label: "The same agent with a framework" },
  { id: "memory", label: "Memory across turns" },
  { id: "streaming", label: "Streaming and tracing" },
  { id: "defaults", label: "What the framework decides for you" },
];

const REPO = "https://github.com/Mikkaiser/agentic-corner-store";

export default function Post() {
  return (
    <>
      <p>
        An agent sounds like a new kind of software. Underneath, it is an LLM call inside a loop, with a short list of
        functions the model is allowed to ask you to run. I built a{" "}
        <A href={REPO}>corner store assistant</A> to see that loop from the inside: a terminal chat for a small shop
        that answers questions about stock and prices. This post rebuilds its core by hand, starting from a single API
        call, and then with a framework, to show how much of the work the framework takes over.
      </p>
      <p>
        Every snippet comes in Python, TypeScript and C#. Pick a language on any code card and the rest of the page
        follows.
      </p>
      <p>
        The store sells five products, and the customer asks one question: <em>Do you have milk, and how much is a
        bottle?</em> A language model has never seen this shop. Its training data holds no stock levels and no prices
        for it, so the only honest way to answer is to look them up.
      </p>

      <H2 id="one-call">A single call</H2>
      <p>Start with one request. A list of messages goes in, one message comes out.</p>
      <CodeTabs {...CODE.a1} />
      <p>
        That is the whole interface. The model is stateless: it remembers nothing between calls, so a chat is your code
        resending the growing list of messages every time. Asked about the milk, this call can only guess, or say it
        cannot see the shelves. Both are reasonable answers from a model with no access to the shop.
      </p>

      <H2 id="tools">Giving the model tools</H2>
      <p>
        A tool is an ordinary function plus a description the model can read. The function stays in your code. The
        model never runs anything: it replies with a request to call a function by name with some arguments, and your
        code decides whether to do it.
      </p>
      <CodeTabs {...CODE.a2} />
      <p>
        The name, the description and the JSON schema are all the model ever sees of a function, so they do the job of
        documentation. Both tools take one product name, so a small helper builds both schemas. Setting{" "}
        <Code>strict</Code> to true makes the API guarantee that the arguments match the schema. In exchange, every
        property has to be listed in <Code>required</Code> and <Code>additionalProperties</Code> has to be false.
      </p>
      <p>
        The map from tool name to function is the dispatch table: when the model asks for <Code>get_price</Code>, the
        loop looks the name up there. The lookups ignore case, because models send &ldquo;Milk&rdquo; as often as
        &ldquo;milk&rdquo;.
      </p>

      <H2 id="loop">The loop</H2>
      <p>
        Now put the call in a loop. Each turn sends the conversation and the tool definitions. If the reply contains
        tool calls, the loop runs them, adds the results to the conversation and goes round again. If the reply is
        plain text, that is the answer.
      </p>
      <CodeTabs {...CODE.a3} />
      <p>
        Trace the question through it. On the first turn the model can ask for both facts in one reply, two tool calls
        side by side: <Code>check_stock(&quot;milk&quot;)</Code> and <Code>get_price(&quot;milk&quot;)</Code>. The
        loop runs both, appends the two results and calls the model again. On the second turn the model has 12 units
        and 7.00 AED in its context and answers in text, which ends the loop. If it asks for the facts one at a time
        instead, the loop takes one extra turn.
      </p>
      <Quote>The model decides which step comes next. The code keeps running steps until the model says it is done.</Quote>
      <p>
        That is the line between an agent and a workflow. In a workflow your code fixes the order of the steps, and
        the model fills in each one. In an agent the model chooses the next step, and your code only enforces the
        rules.
      </p>
      <p>
        I used Chat Completions here because the growing list of messages makes the loop easy to see. OpenAI
        recommends the Responses API for new projects, and{" "}
        <A href="https://developers.openai.com/api/docs/guides/function-calling">some newer models</A> only support
        tool calling there. The loop has the same shape in either API.
      </p>

      <H2 id="details">The details that keep it working</H2>
      <p>The loop is short, but four details in it are easy to get wrong.</p>
      <ul>
        <li>
          <strong>Order matters.</strong> The assistant message that carries the tool calls goes into the history
          before their results. Each result is a <Code>tool</Code> message with the <Code>tool_call_id</Code> of the
          call it answers, and every call needs exactly one answer, or the next request is rejected.
        </li>
        <li>
          <strong>One reply can hold several calls.</strong> Run all of them before calling the model again.
        </li>
        <li>
          <strong>Errors are results.</strong> An unknown tool, bad arguments or an exception inside the function
          become the text of the tool result. The model reads the error and can correct itself. Crashing the loop
          throws that chance away.
        </li>
        <li>
          <strong>The step cap is the brake.</strong> The model decides when to stop, so the code needs a limit for
          when it never does. Every step is a paid request.
        </li>
      </ul>
      <p>
        Arguments also arrive as a JSON string, so they need parsing before the function sees them, which is why each
        version calls a JSON parser inside the <Code>try</Code>.
      </p>

      <H2 id="framework">The same agent with a framework</H2>
      <p>
        Agent frameworks package exactly this loop. The corner store uses the OpenAI Agents SDK, which exists for
        Python and TypeScript. OpenAI does not publish a .NET version, so the C# tab uses{" "}
        <A href="https://github.com/microsoft/agent-framework">Microsoft Agent Framework</A>, which reached 1.0 in
        April 2026 and works with the same OpenAI client.
      </p>
      <CodeTabs {...CODE.b1} />
      <p>
        The tools are now just functions. The framework reads each signature to build the schema: type hints and the
        docstring in Python, the zod schema in TypeScript, the parameter types and <Code>[Description]</Code>{" "}
        attributes in C#. That last one has a side effect: the C# parameter is called <Code>productName</Code>, so
        that is the name the model sees. The dispatch table, the message bookkeeping, the argument parsing and the loop
        itself are gone, and the step cap is a single option.
      </p>

      <H2 id="memory">Memory across turns</H2>
      <p>
        A chat is the same loop run once per message, with everything said so far sent again. Follow-ups such as{" "}
        <em>how much for 3 of them?</em> only work because the history carries the earlier tool results: the model
        finds 7.00 AED in its context and never has to ask again.
      </p>
      <CodeTabs {...CODE.b2} />
      <p>
        Each framework hands the history back in its own shape. In Python, <Code>to_input_list()</Code> returns every
        item of the run, tool calls and results included, and you add the next user message yourself. TypeScript does
        the same with <Code>result.history</Code> and the <Code>user()</Code> helper. In C#, an{" "}
        <Code>AgentSession</Code> keeps the history for you, so the loop never touches it. In the corner store the
        history is a plain list that lives as long as the script; the <A href={REPO}>exercise brief</A> also describes
        a SQLite version that survives a restart.
      </p>

      <H2 id="streaming">Streaming and tracing</H2>
      <p>
        A run can take a few seconds while tools execute, so the corner store streams: the answer appears word by word,
        and a <Code>[tool]</Code> line shows each call as it finishes.
      </p>
      <CodeTabs {...CODE.b3} />
      <p>
        Two kinds of events arrive. Text deltas are pieces of the answer. Run items describe tool activity, and all
        the calls of a turn arrive before their results, which is why each version keeps a map keyed by the call id to
        pair them up.
      </p>
      <p>
        The trace block is the other half. Each turn becomes a trace in the OpenAI dashboard, and the shared group id
        ties every turn of one chat together, so you can open a follow-up and see the earlier messages in the model
        call&rsquo;s input. Agent Framework traces through OpenTelemetry instead: <Code>UseOpenTelemetry()</Code> on
        the agent emits a span for the agent, each model call and each tool.
      </p>

      <H2 id="defaults">What the framework decides for you</H2>
      <p>Fewer lines also means defaults you did not choose. These are the ones worth knowing before shipping.</p>
      <ul>
        <li>
          <strong>Turn limits.</strong> The Agents SDK raises an error when it hits the cap. Agent Framework, at the
          cap, makes one last request without tools, so you still get a text answer.
        </li>
        <li>
          <strong>Unknown tools.</strong> Both Agents SDKs stop with an error by default. Setting{" "}
          <Code>tool_not_found_behavior</Code> in Python or <Code>toolNotFoundBehavior</Code> in TypeScript to{" "}
          <Code>&quot;return_error_to_model&quot;</Code> gives the behaviour of the hand-written loop. Agent Framework
          already sends the error back to the model.
        </li>
        <li>
          <strong>Exceptions.</strong> The frameworks send the model a generic error message and keep the exception
          text to themselves. That is safer, and harder to debug.
        </li>
        <li>
          <strong>Tracing.</strong> The Agents SDKs send a trace of every run to OpenAI by default.{" "}
          <Code>OPENAI_AGENTS_DISABLE_TRACING=1</Code> turns it off.
        </li>
        <li>
          <strong>The API underneath.</strong> The Agents SDKs call the Responses API, so the requests they make are not
          the ones the hand-written loop made. Agent Framework, built on a <Code>ChatClient</Code>, still uses Chat
          Completions.
        </li>
      </ul>
      <p>
        My rule after building both: write the loop by hand once, for the understanding, then use a framework and read
        its defaults the way you would read your own loop. When a framework does something surprising, the loop
        section above is what it is doing underneath.
      </p>
      <p>
        The corner store did not stop at one agent. Its second phase splits the assistant into a team: writers running
        in parallel, specialists called as tools and a checkout reached through a handoff. That is the{" "}
        <A href="/blog/ai-agents-from-one-agent-to-a-team">next post</A>, and the full code is in the{" "}
        <A href={REPO}>repository</A>.
      </p>
    </>
  );
}
