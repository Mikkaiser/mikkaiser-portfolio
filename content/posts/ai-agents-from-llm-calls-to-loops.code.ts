// Code for AI Agents: From LLM Calls To Loops. Every snippet was type-checked or compiled and run against a mock OpenAI server.
// Snippets are plain strings; when you change one, re-run it against the SDK before publishing.

export const CODE = {
  a1: {
    py: `from openai import OpenAI

client = OpenAI()

# One request: a list of messages goes in, one message comes back.
response = client.chat.completions.create(
    model="gpt-5.4-mini",
    messages=[{"role": "user", "content": "Do you have milk, and how much is a bottle?"}],
)
print(response.choices[0].message.content)`,
    ts: `import OpenAI from "openai";

const client = new OpenAI();

// One request: a list of messages goes in, one message comes back.
const response = await client.chat.completions.create({
  model: "gpt-5.4-mini",
  messages: [{ role: "user", content: "Do you have milk, and how much is a bottle?" }],
});
console.log(response.choices[0].message.content);`,
    cs: `using OpenAI.Chat;

ChatClient client = new("gpt-5.4-mini", Environment.GetEnvironmentVariable("OPENAI_API_KEY"));

// One request: a list of messages goes in, one message comes back.
ChatCompletion completion = client.CompleteChat("Do you have milk, and how much is a bottle?");
Console.WriteLine(completion.Content[0].Text);`,
  },
  a2: {
    py: `INVENTORY = {
    "milk": {"price": 7.00, "stock": 12},
    "bread": {"price": 4.50, "stock": 0},
    "eggs": {"price": 12.00, "stock": 8},
    "apples": {"price": 3.00, "stock": 30},
    "coffee": {"price": 25.00, "stock": 5},
}


# The tools are normal functions. No AI in here.
def check_stock(product_name: str) -> str:
    return f"{INVENTORY[product_name]['stock']} units in stock"


def get_price(product_name: str) -> str:
    return f"{INVENTORY[product_name]['price']:.2f} AED"


# Lets the loop find a function from the name the model sends.
TOOL_FUNCTIONS = {"check_stock": check_stock, "get_price": get_price}


# The name and description are what the model reads.
def product_tool(name: str, description: str) -> dict:
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": {
                "type": "object",
                "properties": {"product_name": {"type": "string", "description": "e.g. 'milk'"}},
                "required": ["product_name"],
            },
        },
    }


TOOLS = [
    product_tool("check_stock", "Check how many units of a product are in stock."),
    product_tool("get_price", "Get the unit price of a product, in AED."),
]`,
    ts: `import OpenAI from "openai";

const INVENTORY: Record<string, { price: number; stock: number }> = {
  milk: { price: 7.0, stock: 12 },
  bread: { price: 4.5, stock: 0 },
  eggs: { price: 12.0, stock: 8 },
  apples: { price: 3.0, stock: 30 },
  coffee: { price: 25.0, stock: 5 },
};

// The tools are normal functions. No AI in here.
function checkStock(productName: string): string {
  return \`\${INVENTORY[productName].stock} units in stock\`;
}

function getPrice(productName: string): string {
  return \`\${INVENTORY[productName].price.toFixed(2)} AED\`;
}

// Lets the loop find a function from the name the model sends.
const toolFunctions: Record<string, (args: { product_name: string }) => string> = {
  check_stock: ({ product_name }) => checkStock(product_name),
  get_price: ({ product_name }) => getPrice(product_name),
};

// The name and description are what the model reads.
function productTool(name: string, description: string): OpenAI.ChatCompletionTool {
  return {
    type: "function",
    function: {
      name,
      description,
      parameters: {
        type: "object",
        properties: { product_name: { type: "string", description: "e.g. 'milk'" } },
        required: ["product_name"],
      },
    },
  };
}

const tools = [
  productTool("check_stock", "Check how many units of a product are in stock."),
  productTool("get_price", "Get the unit price of a product, in AED."),
];`,
    cs: `using System.Text.Json;
using OpenAI.Chat;

Dictionary<string, (decimal Price, int Stock)> inventory = new()
{
    ["milk"] = (7.00m, 12),
    ["bread"] = (4.50m, 0),
    ["eggs"] = (12.00m, 8),
    ["apples"] = (3.00m, 30),
    ["coffee"] = (25.00m, 5),
};

// The tools are normal functions. No AI in here.
string CheckStock(string productName) => $"{inventory[productName].Stock} units in stock";

string GetPrice(string productName) => $"{inventory[productName].Price:F2} AED";

// Lets the loop find a function from the name the model sends.
Dictionary<string, Func<JsonElement, string>> toolFunctions = new()
{
    ["check_stock"] = args => CheckStock(args.GetProperty("product_name").GetString()!),
    ["get_price"] = args => GetPrice(args.GetProperty("product_name").GetString()!),
};

// The name and description are what the model reads.
static ChatTool ProductTool(string name, string description) => ChatTool.CreateFunctionTool(
    functionName: name,
    functionDescription: description,
    functionParameters: BinaryData.FromString("""
        {
          "type": "object",
          "properties": { "product_name": { "type": "string", "description": "e.g. 'milk'" } },
          "required": ["product_name"]
        }
        """));

ChatCompletionOptions options = new()
{
    Tools =
    {
        ProductTool("check_stock", "Check how many units of a product are in stock."),
        ProductTool("get_price", "Get the unit price of a product, in AED."),
    },
};`,
  },
  a3: {
    py: `import json

SYSTEM_PROMPT = (
    "You are a friendly assistant for a small corner store. Keep answers short. "
    "Never state a price or a stock level from memory: use the tools."
)
MAX_STEPS = 10


def run(question: str) -> str:
    # The conversation so far: the rules first, then the question.
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": question},
    ]
    # The brake: give up after MAX_STEPS rounds.
    for _ in range(MAX_STEPS):
        response = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=messages,
            tools=TOOLS,
        )
        message = response.choices[0].message
        # No tool calls means plain text: that is the answer.
        if not message.tool_calls:
            return message.content
        # Keep the model's request in the history, before the results.
        messages.append(message)
        # Run each tool the model asked for and add its result.
        for call in message.tool_calls:
            name = call.function.name
            arguments = json.loads(call.function.arguments)
            result = TOOL_FUNCTIONS[name](**arguments)
            # The id tells the model which request this result answers.
            messages.append({"role": "tool", "tool_call_id": call.id, "content": result})
    return f"Stopped after {MAX_STEPS} steps."


print(run("Do you have milk, and how much is a bottle?"))`,
    ts: `const SYSTEM_PROMPT =
  "You are a friendly assistant for a small corner store. Keep answers short. " +
  "Never state a price or a stock level from memory: use the tools.";
const MAX_STEPS = 10;

async function run(question: string) {
  // The conversation so far: the rules first, then the question.
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: question },
  ];
  // The brake: give up after MAX_STEPS rounds.
  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await client.chat.completions.create({
      model: "gpt-5.4-mini",
      messages,
      tools,
    });
    const message = response.choices[0].message;
    // No tool calls means plain text: that is the answer.
    if (!message.tool_calls) return message.content;
    // Keep the model's request in the history, before the results.
    messages.push(message);
    // Run each tool the model asked for and add its result.
    for (const call of message.tool_calls) {
      if (call.type !== "function") continue;
      const name = call.function.name;
      const args = JSON.parse(call.function.arguments);
      const result = toolFunctions[name](args);
      // The id tells the model which request this result answers.
      messages.push({ role: "tool", tool_call_id: call.id, content: result });
    }
  }
  return \`Stopped after \${MAX_STEPS} steps.\`;
}

console.log(await run("Do you have milk, and how much is a bottle?"));`,
    cs: `const string SystemPrompt =
    "You are a friendly assistant for a small corner store. Keep answers short. " +
    "Never state a price or a stock level from memory: use the tools.";
const int MaxSteps = 10;

async Task<string> RunAsync(string question)
{
    // The conversation so far: the rules first, then the question.
    List<ChatMessage> messages = [new SystemChatMessage(SystemPrompt), new UserChatMessage(question)];
    // The brake: give up after MaxSteps rounds.
    for (int step = 0; step < MaxSteps; step++)
    {
        ChatCompletion completion = await client.CompleteChatAsync(messages, options);
        // No tool calls means plain text: that is the answer.
        if (completion.ToolCalls.Count == 0) return completion.Content[0].Text;
        // Keep the model's request in the history, before the results.
        messages.Add(new AssistantChatMessage(completion));
        // Run each tool the model asked for and add its result.
        foreach (ChatToolCall call in completion.ToolCalls)
        {
            using JsonDocument args = JsonDocument.Parse(call.FunctionArguments);
            string result = toolFunctions[call.FunctionName](args.RootElement);
            // The id tells the model which request this result answers.
            messages.Add(new ToolChatMessage(call.Id, result));
        }
    }
    return $"Stopped after {MaxSteps} steps.";
}

Console.WriteLine(await RunAsync("Do you have milk, and how much is a bottle?"));`,
  },
  b1: {
    py: `from agents import Agent, Runner, function_tool

INVENTORY = {
    "milk": {"price": 7.00, "stock": 12},
    "bread": {"price": 4.50, "stock": 0},
    "eggs": {"price": 12.00, "stock": 8},
    "apples": {"price": 3.00, "stock": 30},
    "coffee": {"price": 25.00, "stock": 5},
}


# The decorator turns a plain function into a tool.
@function_tool
def check_stock(product_name: str) -> str:
    """Check how many units of a product are in stock."""
    return f"{INVENTORY[product_name]['stock']} units in stock"


@function_tool
def get_price(product_name: str) -> str:
    """Get the unit price of a product, in AED."""
    return f"{INVENTORY[product_name]['price']:.2f} AED"


# The agent: its rules, its model and its tools.
agent = Agent(
    name="Corner Store Assistant",
    instructions=(
        "You are a friendly assistant for a small corner store. Keep answers short. "
        "Never state a price or a stock level from memory: use the tools."
    ),
    model="gpt-5.4-mini",
    tools=[check_stock, get_price],
)

# The framework runs the whole loop, with the same 10-round brake.
result = Runner.run_sync(agent, "Do you have milk, and how much is a bottle?", max_turns=10)
print(result.final_output)`,
    ts: `import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

const INVENTORY: Record<string, { price: number; stock: number }> = {
  milk: { price: 7.0, stock: 12 },
  bread: { price: 4.5, stock: 0 },
  eggs: { price: 12.0, stock: 8 },
  apples: { price: 3.0, stock: 30 },
  coffee: { price: 25.0, stock: 5 },
};

// tool() turns a function into a tool, schema included.
const checkStock = tool({
  name: "check_stock",
  description: "Check how many units of a product are in stock.",
  parameters: z.object({ product_name: z.string() }),
  execute: ({ product_name }) => {
    return \`\${INVENTORY[product_name].stock} units in stock\`;
  },
});

const getPrice = tool({
  name: "get_price",
  description: "Get the unit price of a product, in AED.",
  parameters: z.object({ product_name: z.string() }),
  execute: ({ product_name }) => {
    return \`\${INVENTORY[product_name].price.toFixed(2)} AED\`;
  },
});

// The agent: its rules, its model and its tools.
const agent = new Agent({
  name: "Corner Store Assistant",
  instructions:
    "You are a friendly assistant for a small corner store. Keep answers short. " +
    "Never state a price or a stock level from memory: use the tools.",
  model: "gpt-5.4-mini",
  tools: [checkStock, getPrice],
});

// The framework runs the whole loop, with the same 10-round brake.
const result = await run(agent, "Do you have milk, and how much is a bottle?", { maxTurns: 10 });
console.log(result.finalOutput);`,
    cs: `using System.ComponentModel;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using OpenAI.Chat;

Dictionary<string, (decimal Price, int Stock)> inventory = new()
{
    ["milk"] = (7.00m, 12),
    ["bread"] = (4.50m, 0),
    ["eggs"] = (12.00m, 8),
    ["apples"] = (3.00m, 30),
    ["coffee"] = (25.00m, 5),
};

// The attribute and the signature become the tool's description and schema.
[Description("Check how many units of a product are in stock.")]
string CheckStock(string productName) => $"{inventory[productName].Stock} units in stock";

[Description("Get the unit price of a product, in AED.")]
string GetPrice(string productName) => $"{inventory[productName].Price:F2} AED";

// The agent: its rules, its model and its tools.
AIAgent agent = new ChatClient("gpt-5.4-mini", Environment.GetEnvironmentVariable("OPENAI_API_KEY"))
    .AsAIAgent(
        name: "Corner Store Assistant",
        instructions: "You are a friendly assistant for a small corner store. Keep answers short. " +
            "Never state a price or a stock level from memory: use the tools.",
        tools:
        [
            AIFunctionFactory.Create(CheckStock, name: "check_stock"),
            AIFunctionFactory.Create(GetPrice, name: "get_price"),
        ],
        clientFactory: chat => chat.AsBuilder()
            .UseFunctionInvocation(configure: f => f.MaximumIterationsPerRequest = 10)
            .Build());

// The framework runs the whole loop, with the same 10-round brake.
Console.WriteLine(await agent.RunAsync("Do you have milk, and how much is a bottle?"));`,
  },
  b2: {
    py: `from agents import Runner

history = []
while True:
    question = input("You: ")
    if question == "exit":
        break

    history.append({"role": "user", "content": question})
    result = Runner.run_sync(agent, history)
    print("Agent:", result.final_output)

    # The result carries the whole conversation, ready for the next question.
    history = result.to_input_list()`,
    ts: `import { run, user, type AgentInputItem } from "@openai/agents";
import { createInterface } from "node:readline/promises";

const rl = createInterface({ input: process.stdin, output: process.stdout });
let history: AgentInputItem[] = [];

while (true) {
  const question = await rl.question("You: ");
  if (question === "exit") break;

  const result = await run(agent, [...history, user(question)]);
  console.log("Agent:", result.finalOutput);

  // The result carries the whole conversation, ready for the next question.
  history = result.history;
}`,
    cs: `using Microsoft.Agents.AI;

// The session remembers the conversation between questions.
AgentSession session = await agent.CreateSessionAsync();

while (true)
{
    Console.Write("You: ");
    string? question = Console.ReadLine();
    if (question is null or "exit") break;

    var response = await agent.RunAsync(question, session);
    Console.WriteLine($"Agent: {response}");
}`,
  },
  b3: {
    py: `import asyncio
from agents import Runner, trace

async def main():
    history = []
    while True:
        question = input("You: ")
        if question == "exit":
            break

        history.append({"role": "user", "content": question})

        # trace() groups everything this turn does in the OpenAI dashboard.
        with trace("Corner Store Assistant"):
            result = Runner.run_streamed(agent, history)

            async for event in result.stream_events():
                if event.type == "raw_response_event":
                    # A piece of the answer: print it right away.
                    if event.data.type == "response.output_text.delta":
                        print(event.data.delta, end="", flush=True)

                elif event.type == "run_item_stream_event":
                    # The model asked for a tool: show which one.
                    if event.item.type == "tool_call_item":
                        print(f"\\n[tool] {event.item.raw_item.name}")

        print()
        history = result.to_input_list()

asyncio.run(main())`,
    ts: `import { run, user, withTrace, type AgentInputItem } from "@openai/agents";
import { createInterface } from "node:readline/promises";

const rl = createInterface({ input: process.stdin, output: process.stdout });
let history: AgentInputItem[] = [];

while (true) {
  const question = await rl.question("You: ");
  if (question === "exit") break;

  // withTrace() groups everything this turn does in the OpenAI dashboard.
  await withTrace("Corner Store Assistant", async () => {
    const stream = await run(agent, [...history, user(question)], { stream: true });

    for await (const event of stream) {
      if (event.type === "raw_model_stream_event") {
        // A piece of the answer: print it right away.
        if (event.data.type === "output_text_delta") {
          process.stdout.write(event.data.delta);
        }
      }

      if (event.type === "run_item_stream_event") {
        // The model asked for a tool: show which one.
        const call = event.item.rawItem;
        if (event.item.type === "tool_call_item" && call.type === "function_call") {
          console.log(\`\\n[tool] \${call.name}\`);
        }
      }
    }

    await stream.completed;
    console.log();
    history = stream.history;
  });
}`,
    cs: `using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

AgentSession session = await agent.CreateSessionAsync();

while (true)
{
    Console.Write("You: ");
    string? question = Console.ReadLine();
    if (question is null or "exit") break;

    await foreach (AgentResponseUpdate update in agent.RunStreamingAsync(question, session))
    {
        // A piece of the answer: print it right away.
        Console.Write(update.Text);

        // The model asked for a tool: show which one.
        foreach (AIContent content in update.Contents)
        {
            if (content is FunctionCallContent call)
                Console.WriteLine($"\\n[tool] {call.Name}");
        }
    }

    Console.WriteLine();
}`,
  },
};
