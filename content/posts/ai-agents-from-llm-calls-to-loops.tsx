import { AgentLoop } from "@/components/blog/AgentLoop";
import { CodeTabs } from "@/components/blog/CodeTabs";
import { Term } from "@/components/blog/Term";
import { A, Code, H2, Quote } from "@/components/blog/Prose";
import type { PostMeta, TocItem } from "@/lib/posts";
import { CODE } from "./ai-agents-from-llm-calls-to-loops.code";

export const meta: PostMeta = {
  slug: "ai-agents-from-llm-calls-to-loops",
  title: "AI Agents: From LLM Calls To Loops",
  summary: "Building a corner store agent by hand in Python, TypeScript and C#, then rebuilding it with a framework.",
  lead: "An agent is just a model call inside a loop. Write that loop by hand once and every framework gets a lot less mysterious.",
  topic: "AI",
  date: "2026-10-11",
  minutes: 10,
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
        &ldquo;Agent&rdquo; sounds like a whole new kind of software. It isn&rsquo;t. It&rsquo;s an{" "}
        <Term id="llm" label="LLM" title="Large language model" href="https://en.wikipedia.org/wiki/Large_language_model">
          A model trained on a huge pile of text to predict what comes next, one small piece at a time. GPT, Claude
          and Gemini are all LLMs. Very good at writing, zero idea what&rsquo;s on your shelves.
        </Term>{" "}
        call inside a loop, plus a short list of functions the model is allowed to ask you to run. To see that loop from the
        inside, I built a <A href={REPO}>corner store assistant</A>: a terminal chat for a small shop that answers
        questions about stock and prices. In this post I rebuild it by hand, starting from one API call, and then
        again with a framework, so you can see how much work the framework is doing for you.
      </p>
      <figure className="figure">
        <div className="diagram"><AgentLoop /></div>
        <figcaption className="figure__cap">
          One call answers once, with whatever the model already knows. An agent keeps calling the model, feeding it
          tool results each time, until it has a real answer for you.
        </figcaption>
      </figure>
      <p>
        That&rsquo;s the whole idea: LLM calls in a loop, going after a goal. Everything else in this post is
        details.
      </p>
      <p>
        Every snippet comes in Python, TypeScript and C#. Pick a language on any code card and the rest of the page
        switches with it.
      </p>
      <p>
        The store sells five products, and a customer asks one question: <em>Do you have milk, and how much is a
        bottle?</em> The model has never seen this shop. It doesn&rsquo;t know the stock or the prices, so the only
        honest way to answer is to look them up.
      </p>

      <H2 id="one-call">A single call</H2>
      <p>Let&rsquo;s start with one request. A list of messages goes in, one message comes out.</p>
      <CodeTabs {...CODE.a1} />
      <p>
        That&rsquo;s the whole interface. The model is{" "}
        <Term id="stateless" label="stateless" href="https://en.wikipedia.org/wiki/Stateless_protocol">
          It keeps nothing between requests. Every call starts from zero, so anything the model should know has to
          be inside that request.
        </Term>
        : it remembers nothing between calls, so a
        &ldquo;chat&rdquo; is really your code sending the whole conversation again every time. Ask it about the milk
        and it can only guess, or tell you it can&rsquo;t see the shelves. Fair enough. It has never been to the
        shop.
      </p>

      <H2 id="tools">Giving the model tools</H2>
      <p>
        A tool is a normal function plus a description the model can read. The function stays in your code. The model
        never runs anything itself: it replies with &ldquo;please call this function with these arguments&rdquo;, and
        your code decides whether to do it.
      </p>
      <CodeTabs {...CODE.a2} />
      <p>
        The name, the description and the{" "}
        <Term id="json-schema" label="JSON schema" title="JSON Schema" href="https://json-schema.org/">
          A JSON document that describes the shape of other JSON: which fields exist, their types and which ones are
          required. Here it tells the model what arguments a tool takes.
        </Term>{" "}
        are all the model ever sees of your function, so write them
        like documentation. Both tools take one product name, so a small helper builds both schemas. Setting{" "}
        <Code>strict</Code> to true makes the API guarantee the arguments match the schema. The catch: every property
        has to be in <Code>required</Code> and <Code>additionalProperties</Code> has to be false.
      </p>
      <p>
        The map from tool name to function is the{" "}
        <Term id="dispatch" label="dispatch table" href="https://en.wikipedia.org/wiki/Dispatch_table">
          A lookup from a name to the function that handles it. Instead of a long chain of ifs, the code finds the
          function by its name and calls it.
        </Term>
        . When the model asks for <Code>get_price</Code>, the
        loop looks the name up there. The lookups ignore case, because models send &ldquo;Milk&rdquo; as often as
        &ldquo;milk&rdquo;.
      </p>

      <H2 id="loop">The loop</H2>
      <p>
        Now put the call in a loop. Each turn sends the conversation and the tools. If the reply has tool calls, the
        loop runs them, adds the results to the conversation and goes around again. If the reply is plain text,
        that&rsquo;s the answer and we&rsquo;re done.
      </p>
      <CodeTabs {...CODE.a3} />
      <p>
        Let&rsquo;s follow the milk question. On the first turn the model can ask for both facts at once, two tool
        calls in one reply: <Code>check_stock(&quot;milk&quot;)</Code> and <Code>get_price(&quot;milk&quot;)</Code>.
        The loop runs both, adds the two results and calls the model again. On the second turn the model has 12 units
        and 7.00 AED right there in the conversation, so it answers in text and the loop ends. If it asks for the facts
        one at a time instead, it just takes one more turn.
      </p>
      <Quote>The model decides what happens next. Your code keeps going until the model says it&rsquo;s done.</Quote>
      <p>
        That&rsquo;s the difference between an agent and a workflow. In a workflow, your code fixes the order of the
        steps and the model fills each one in. In an agent, the model picks the next step, and your code just enforces
        the rules.
      </p>
      <p>
        I used Chat Completions here because the growing list of messages makes the loop easy to see. OpenAI
        recommends the{" "}
        <Term id="responses" label="Responses API">
          OpenAI&rsquo;s newer API for talking to its models. It can keep the conversation on OpenAI&rsquo;s side and
          comes with built-in tools like web search. Chat Completions is the older, simpler one.
        </Term>{" "}
        for new projects, and{" "}
        <A href="https://developers.openai.com/api/docs/guides/function-calling">some newer models</A> only support
        tool calling there. The loop looks the same in both.
      </p>

      <H2 id="details">The details that keep it working</H2>
      <p>The loop is short, but there are four details that are easy to get wrong.</p>
      <ul>
        <li>
          <strong>Order matters.</strong> The assistant message with the tool calls goes into the history before their
          results. Each result is a <Code>tool</Code> message with the <Code>tool_call_id</Code> of the call it
          answers. Every call needs exactly one answer, or the next request gets rejected.
        </li>
        <li>
          <strong>One reply can have several calls.</strong> Run all of them before you call the model again.
        </li>
        <li>
          <strong>Errors are results too.</strong> An unknown tool, bad arguments, an exception inside the function:
          send it back as the tool result. The model reads the error and can fix its own mistake. If you crash the
          loop instead, it never gets the chance.
        </li>
        <li>
          <strong>The step limit is the brake.</strong> The model decides when to stop, so you need a limit for when
          it doesn&rsquo;t. Every step is a paid request, and the model isn&rsquo;t the one paying.
        </li>
      </ul>
      <p>
        The arguments also arrive as a JSON string, so they need parsing before the function sees them. That&rsquo;s
        why every version parses them inside the <Code>try</Code>.
      </p>

      <H2 id="framework">The same agent with a framework</H2>
      <p>
        Agent frameworks are basically this loop in a box. The corner store uses the OpenAI Agents SDK, which exists
        for Python and TypeScript. OpenAI doesn&rsquo;t have a .NET version, so the C# tab uses{" "}
        <A href="https://github.com/microsoft/agent-framework">Microsoft Agent Framework</A>, which reached 1.0 in
        April 2026 and works with the same OpenAI client.
      </p>
      <CodeTabs {...CODE.b1} />
      <p>
        The tools are just functions now. The framework reads each signature to build the schema: type hints and the
        docstring in Python (finally, someone reads the docstrings), the{" "}
        <Term id="zod" label="zod" title="Zod" href="https://zod.dev/">
          A TypeScript library for describing the shape of your data and checking it at runtime. The Agents SDK
          turns a zod schema into the JSON schema the model sees.
        </Term>{" "}
        schema in TypeScript, the parameter types
        and <Code>[Description]</Code> attributes in C#. One side effect: the C# parameter is called{" "}
        <Code>productName</Code>, so that&rsquo;s the name the model sees. The dispatch table, the message
        bookkeeping, the argument parsing and the loop itself are gone, and the step limit is a single option.
      </p>

      <H2 id="memory">Memory across turns</H2>
      <p>
        A chat is the same loop run once per message, with everything said so far sent again. A follow-up like{" "}
        <em>how much for 3 of them?</em> only works because the history carries the earlier tool results. The model
        finds 7.00 AED in the conversation and doesn&rsquo;t need to ask again.
      </p>
      <CodeTabs {...CODE.b2} />
      <p>
        Each framework hands the history back in its own way. In Python, <Code>to_input_list()</Code> returns every
        item of the run, tool calls and results included, and you add the next user message yourself. TypeScript does
        the same with <Code>result.history</Code> and the <Code>user()</Code> helper. In C#, an{" "}
        <Code>AgentSession</Code> keeps the history for you, so the loop never touches it. In the corner store the
        history is a plain list that lives as long as the script. The <A href={REPO}>exercise brief</A> also describes
        a{" "}
        <Term id="sqlite" label="SQLite" href="https://sqlite.org/">
          A small database that lives in a single file. No server to run, which is perfect for a corner store.
        </Term>{" "}
        version that survives a restart.
      </p>

      <H2 id="streaming">Streaming and tracing</H2>
      <p>
        A run can take a few seconds while the tools work, and staring at a blank terminal is no fun. So the corner
        store streams: the answer shows up word by word, and a <Code>[tool]</Code> line appears for each call as it
        finishes.
      </p>
      <CodeTabs {...CODE.b3} />
      <p>
        Two kinds of events come in. <Term id="deltas" label="Text deltas">
          The small chunks of text a streaming response sends while the model is still writing. Glue them together
          in order and you get the full answer.
        </Term>{" "}
        are pieces of the answer. Run items are the tool activity, and all
        the calls of a turn arrive before their results, which is why each version keeps a map by call id to match
        them up.
      </p>
      <p>
        The trace block is the other half. Each turn becomes a trace in the OpenAI dashboard, and the shared group id
        ties all the turns of one chat together, so you can open a follow-up and see the earlier messages in the
        model&rsquo;s input. Agent Framework traces through{" "}
        <Term id="otel" label="OpenTelemetry" href="https://opentelemetry.io/">
          An open standard for traces, metrics and logs. Your app reports what it did as spans, little timed blocks
          of work, and any compatible tool can show them.
        </Term>{" "}
        instead: <Code>UseOpenTelemetry()</Code> on
        the agent gives you a span for the agent, each model call and each tool.
      </p>

      <H2 id="defaults">What the framework decides for you</H2>
      <p>Fewer lines also means someone else made some choices for you. These are the ones worth knowing.</p>
      <ul>
        <li>
          <strong>Turn limits.</strong> The Agents SDK throws an error when it hits the limit. Agent Framework, at the
          limit, makes one last request without tools, so you still get a text answer.
        </li>
        <li>
          <strong>Unknown tools.</strong> Both Agents SDKs stop with an error by default. Setting{" "}
          <Code>tool_not_found_behavior</Code> in Python or <Code>toolNotFoundBehavior</Code> in TypeScript to{" "}
          <Code>&quot;return_error_to_model&quot;</Code> gives you the behaviour of the hand-written loop. Agent
          Framework already sends the error back to the model.
        </li>
        <li>
          <strong>Exceptions.</strong> The frameworks send the model a generic error message and keep the details to
          themselves. Safer, but harder to debug.
        </li>
        <li>
          <strong>Tracing.</strong> The Agents SDKs send a trace of every run to OpenAI by default.{" "}
          <Code>OPENAI_AGENTS_DISABLE_TRACING=1</Code> turns it off.
        </li>
        <li>
          <strong>The API underneath.</strong> The Agents SDKs use the Responses API, so their requests aren&rsquo;t
          the same as the ones the hand-written loop sends. Agent Framework, built on a <Code>ChatClient</Code>, still
          uses Chat Completions.
        </li>
      </ul>
      <p>
        My advice after building both: write the loop by hand once, just to understand it. Then use a framework, and
        read its defaults like you would read your own loop. When the framework does something weird, the loop section
        above is what&rsquo;s happening underneath.
      </p>
      <p>
        The corner store didn&rsquo;t stop at one agent, by the way. Its second phase splits the assistant into a
        team: writers running in parallel, specialists called as tools and a checkout reached through a handoff. The
        full code for both phases is in the <A href={REPO}>repository</A>.
      </p>
    </>
  );
}
