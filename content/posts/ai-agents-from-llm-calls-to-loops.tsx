import { CodeTabs } from "@/components/blog/CodeTabs";
import { A, Code, H2, Quote } from "@/components/blog/Prose";
import type { PostMeta, TocItem } from "@/lib/posts";

export const meta: PostMeta = {
  slug: "ai-agents-from-llm-calls-to-loops",
  title: "AI Agents: From LLM Calls To Loops",
  summary: "Building one agent by hand in Python, TypeScript and C#, then rebuilding it with a framework.",
  lead: "An agent is a model call inside a loop. Write that loop by hand once and every framework becomes easy to read.",
  topic: "AI",
  date: "2026-10-11",
  minutes: 7,
  draft: true,
};

export const toc: TocItem[] = [
  { id: "one-call", label: "A single call" },
  { id: "tools", label: "Giving the model a tool" },
  { id: "loop", label: "The loop" },
  { id: "details", label: "The details that keep it working" },
  { id: "framework", label: "The same agent with a framework" },
  { id: "defaults", label: "What the framework decides for you" },
];

const QUESTION = "What time is it in Abu Dhabi and in São Paulo, and how many hours apart are they?";

export default function Post() {
  return (
    <>
      <p>
        An agent sounds like a new kind of software. Underneath, it is an LLM call inside a loop, with a short list of
        functions the model is allowed to ask you to run. In this post I build one by hand, starting from a single API
        call, and then rebuild it with a framework to show how much of the work the framework takes over.
      </p>
      <p>
        Every snippet comes in Python, TypeScript and C#. Pick a language on any code card and the rest of the page
        follows.
      </p>
      <p>
        The example stays small on purpose. The agent gets one question it cannot answer alone: <em>{QUESTION}</em> A
        language model has no clock. Its training data stops at some date and it has no idea when it is being called,
        so the only honest way to answer is to ask for the time.
      </p>

      <H2 id="one-call">A single call</H2>
      <p>Start with one request. A list of messages goes in, one message comes out.</p>
      <CodeTabs
        py={`
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-5.4-mini",
    messages=[{"role": "user", "content": "What time is it in Abu Dhabi right now?"}],
)
print(response.choices[0].message.content)`}
        ts={`
import OpenAI from "openai";

const client = new OpenAI();

const response = await client.chat.completions.create({
  model: "gpt-5.4-mini",
  messages: [{ role: "user", content: "What time is it in Abu Dhabi right now?" }],
});
console.log(response.choices[0].message.content);`}
        cs={`
using OpenAI.Chat;

ChatClient client = new("gpt-5.4-mini", Environment.GetEnvironmentVariable("OPENAI_API_KEY"));

ChatCompletion completion = client.CompleteChat("What time is it in Abu Dhabi right now?");
Console.WriteLine(completion.Content[0].Text);`}
      />
      <p>
        That is the whole interface. The model is stateless: it remembers nothing between calls, so a chat is your code
        resending the growing list of messages every time. Ask this call about the time in Abu Dhabi and it will either
        guess or say it cannot know. Both are reasonable answers from a model with no access to the world.
      </p>

      <H2 id="tools">Giving the model a tool</H2>
      <p>
        A tool is an ordinary function plus a description the model can read. The function stays in your code. The
        model never runs anything: it replies with a request to call a function by name with some arguments, and your
        code decides whether to do it.
      </p>
      <CodeTabs
        py={`
from datetime import datetime
from zoneinfo import ZoneInfo

from openai.types.chat import ChatCompletionToolParam


def get_time(timezone: str) -> str:
    return datetime.now(ZoneInfo(timezone)).isoformat(timespec="minutes")


TOOLS = {"get_time": get_time}

tools: list[ChatCompletionToolParam] = [{
    "type": "function",
    "function": {
        "name": "get_time",
        "description": "Get the current local time in an IANA timezone.",
        "parameters": {
            "type": "object",
            "properties": {
                "timezone": {"type": "string", "description": "IANA name, e.g. 'Asia/Dubai'"},
            },
            "required": ["timezone"],
            "additionalProperties": False,
        },
        "strict": True,
    },
}]`}
        ts={`
function getTime(timezone: string): string {
  return new Date().toLocaleString("en-US", { timeZone: timezone, timeZoneName: "longOffset" });
}

const toolFns: Record<string, (args: any) => string> = {
  get_time: ({ timezone }) => getTime(timezone),
};

const tools: OpenAI.ChatCompletionTool[] = [{
  type: "function",
  function: {
    name: "get_time",
    description: "Get the current local time in an IANA timezone.",
    parameters: {
      type: "object",
      properties: {
        timezone: { type: "string", description: "IANA name, e.g. 'Asia/Dubai'" },
      },
      required: ["timezone"],
      additionalProperties: false,
    },
    strict: true,
  },
}];`}
        cs={`
using System.Text.Json;

static string GetTime(string timezone) =>
    TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, TimeZoneInfo.FindSystemTimeZoneById(timezone))
        .ToString("yyyy-MM-dd HH:mm zzz");

Dictionary<string, Func<JsonElement, string>> toolFns = new()
{
    ["get_time"] = args => GetTime(args.GetProperty("timezone").GetString()!),
};

ChatTool getTimeTool = ChatTool.CreateFunctionTool(
    functionName: "get_time",
    functionDescription: "Get the current local time in an IANA timezone.",
    functionParameters: BinaryData.FromString("""
        {
          "type": "object",
          "properties": {
            "timezone": { "type": "string", "description": "IANA name, e.g. 'Asia/Dubai'" }
          },
          "required": ["timezone"],
          "additionalProperties": false
        }
        """),
    functionSchemaIsStrict: true);`}
      />
      <p>
        The name, the description and the JSON schema are all the model ever sees of the function, so they do the job
        of documentation. Setting <Code>strict</Code> to true makes the API guarantee that the arguments match the
        schema. In exchange, every property has to be listed in <Code>required</Code> and{" "}
        <Code>additionalProperties</Code> has to be false.
      </p>
      <p>
        The map from tool name to function is the dispatch table. When the model asks for <Code>get_time</Code>, the
        loop looks the name up there.
      </p>

      <H2 id="loop">The loop</H2>
      <p>
        Now put the call in a loop. Each turn sends the conversation and the tool definitions. If the reply contains
        tool calls, the loop runs them, adds the results to the conversation and goes round again. If the reply is
        plain text, that is the answer.
      </p>
      <CodeTabs
        py={`
import json

MAX_STEPS = 10


def run(question: str) -> str:
    messages: list = [{"role": "user", "content": question}]
    for _ in range(MAX_STEPS):
        response = client.chat.completions.create(model="gpt-5.4-mini", messages=messages, tools=tools)
        message = response.choices[0].message
        messages.append(message)
        if not message.tool_calls:
            return message.content or ""
        for call in message.tool_calls:
            try:
                if call.type != "function":
                    raise ValueError(f"Unsupported tool type: {call.type}")
                result = TOOLS[call.function.name](**json.loads(call.function.arguments))
            except Exception as e:
                result = f"Error: {e!r}"
            messages.append({"role": "tool", "tool_call_id": call.id, "content": result})
    return f"Stopped after {MAX_STEPS} steps."


print(run("${QUESTION}"))`}
        ts={`
const MAX_STEPS = 10;

async function run(question: string): Promise<string> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [{ role: "user", content: question }];
  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await client.chat.completions.create({ model: "gpt-5.4-mini", messages, tools });
    const message = response.choices[0].message;
    messages.push(message);
    if (!message.tool_calls?.length) return message.content ?? "";
    for (const call of message.tool_calls) {
      let result: string;
      try {
        if (call.type !== "function") throw new Error(\`Unsupported tool type: \${call.type}\`);
        const fn = toolFns[call.function.name];
        if (!fn) throw new Error(\`Unknown tool: \${call.function.name}\`);
        result = fn(JSON.parse(call.function.arguments));
      } catch (err) {
        result = String(err);
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: result });
    }
  }
  return \`Stopped after \${MAX_STEPS} steps.\`;
}

console.log(await run("${QUESTION}"));`}
        cs={`
const int MaxSteps = 10;
ChatCompletionOptions options = new() { Tools = { getTimeTool } };

async Task<string> RunAsync(string question)
{
    List<ChatMessage> messages = [new UserChatMessage(question)];
    for (int step = 0; step < MaxSteps; step++)
    {
        ChatCompletion completion = await client.CompleteChatAsync(messages, options);
        messages.Add(new AssistantChatMessage(completion));
        if (completion.ToolCalls.Count == 0) return completion.Content[0].Text;
        foreach (ChatToolCall call in completion.ToolCalls)
        {
            string result;
            try
            {
                using JsonDocument args = JsonDocument.Parse(call.FunctionArguments);
                result = toolFns[call.FunctionName](args.RootElement);
            }
            catch (Exception e)
            {
                result = $"Error: {e.Message}";
            }
            messages.Add(new ToolChatMessage(call.Id, result));
        }
    }
    return $"Stopped after {MaxSteps} steps.";
}

Console.WriteLine(await RunAsync("${QUESTION}"));`}
      />
      <p>
        Trace the example through it. On the first turn the model can ask for both times in one reply, two tool calls
        side by side: <Code>get_time(&quot;Asia/Dubai&quot;)</Code> and{" "}
        <Code>get_time(&quot;America/Sao_Paulo&quot;)</Code>. The loop runs both, appends two tool messages and calls
        the model again. On the second turn the model has both times in its context, works out the difference and
        answers in text, which ends the loop. If it asks for the times one at a time instead, the loop takes one extra
        turn.
      </p>
      <Quote>The model decides which step comes next. The code keeps running steps until the model says it is done.</Quote>
      <p>
        That is the line between an agent and a workflow. In a workflow your code fixes the order of the steps, and
        the model fills in each one. In an agent the model chooses the next step, and your code only enforces the
        rules.
      </p>
      <p>
        I used Chat Completions because the growing list of messages makes the loop easy to see. OpenAI recommends
        the Responses API for new projects, and{" "}
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
          become the text of the tool result. The model reads the error and can correct itself, for example by
          retrying with a valid timezone name. Crashing the loop throws that chance away.
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
        Agent frameworks package exactly this loop. For Python and TypeScript I used the OpenAI Agents SDK. OpenAI
        does not publish a .NET version, so the C# tab uses{" "}
        <A href="https://github.com/microsoft/agent-framework">Microsoft Agent Framework</A>, which reached 1.0 in
        April 2026 and works with the same OpenAI client.
      </p>
      <CodeTabs
        py={`
from datetime import datetime
from zoneinfo import ZoneInfo

from agents import Agent, Runner, function_tool


@function_tool
def get_time(timezone: str) -> str:
    """Get the current local time in an IANA timezone.

    Args:
        timezone: IANA name, e.g. 'Asia/Dubai'.
    """
    return datetime.now(ZoneInfo(timezone)).isoformat(timespec="minutes")


agent = Agent(name="Clock", model="gpt-5.4-mini", tools=[get_time])

result = Runner.run_sync(
    agent,
    "${QUESTION}",
    max_turns=10,
)
print(result.final_output)`}
        ts={`
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

const getTime = tool({
  name: "get_time",
  description: "Get the current local time in an IANA timezone.",
  parameters: z.object({ timezone: z.string().describe("IANA name, e.g. 'Asia/Dubai'") }),
  execute: async ({ timezone }) =>
    new Date().toLocaleString("en-US", { timeZone: timezone, timeZoneName: "longOffset" }),
});

const agent = new Agent({ name: "Clock", model: "gpt-5.4-mini", tools: [getTime] });

const result = await run(
  agent,
  "${QUESTION}",
  { maxTurns: 10 },
);
console.log(result.finalOutput);`}
        cs={`
using System.ComponentModel;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using OpenAI.Chat;

[Description("Get the current local time in an IANA timezone.")]
static string GetTime([Description("IANA name, e.g. 'Asia/Dubai'")] string timezone) =>
    TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, TimeZoneInfo.FindSystemTimeZoneById(timezone))
        .ToString("yyyy-MM-dd HH:mm zzz");

AIAgent agent = new ChatClient("gpt-5.4-mini", Environment.GetEnvironmentVariable("OPENAI_API_KEY"))
    .AsAIAgent(
        name: "Clock",
        tools: [AIFunctionFactory.Create(GetTime, name: "get_time")],
        clientFactory: chat => chat.AsBuilder()
            .UseFunctionInvocation(configure: f => f.MaximumIterationsPerRequest = 10)
            .Build());

Console.WriteLine(await agent.RunAsync("${QUESTION}"));`}
      />
      <p>
        The tool is now just the function. The framework reads its signature to build the schema: type hints and the
        docstring in Python, the zod schema in TypeScript, the parameter types and <Code>[Description]</Code>{" "}
        attributes in C#. The dispatch table, the message bookkeeping, the argument parsing and the loop itself are
        gone, and the step cap is a single option.
      </p>

      <H2 id="defaults">What the framework decides for you</H2>
      <p>Fewer lines also means defaults you did not choose. These are the ones worth knowing before shipping.</p>
      <ul>
        <li>
          <strong>Turn limits.</strong> The Agents SDK defaults to 10 turns and raises an error when it hits the cap.
          Agent Framework defaults to 40 and, at the cap, makes one last request without tools, so you still get a text
          answer.
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
          <strong>Tracing.</strong> The Agents SDKs send a trace of every run to OpenAI by default, which is useful in
          the dashboard. <Code>OPENAI_AGENTS_DISABLE_TRACING=1</Code> turns it off.
        </li>
        <li>
          <strong>The API underneath.</strong> The Agents SDKs call the Responses API, so the requests they make are not
          the ones the hand-written loop made.
        </li>
      </ul>
      <p>
        My rule after building both: write the loop by hand once, for the understanding, then use a framework and read
        its defaults the way you would read your own loop. When a framework does something surprising, the loop
        section above is what it is doing underneath.
      </p>
    </>
  );
}
