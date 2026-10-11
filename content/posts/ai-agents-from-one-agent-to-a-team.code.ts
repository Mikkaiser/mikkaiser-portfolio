// Code for AI Agents: From One Agent To A Team. Built from programs that were type-checked or compiled and run against a mock OpenAI server.
// Generated from verified snippet files; edit those and regenerate rather than editing here.

export const CODE = {
  c1: {
    py: `import asyncio
import json
from agents import Agent, Runner, trace

MODEL = "gpt-5.4-mini"
BRIEF = json.dumps({"name": "apples", "price": 3.0, "stock": 30, "discount_code": "SAVE10", "discount_percent": 10})

intro = ("You are a marketing writer for a small neighbourhood corner store. Write a short promo message. "
         "Use only the product, price and discount code in the brief. Never invent prices or offers.\\n")
styles = {
    "Warm Writer": "Your style is warm and friendly, like a shopkeeper who knows every customer by name.",
    "Witty Writer": "Your style is witty and playful, with a light pun. Never mean or over the top.",
    "Direct Writer": "Your style is short and direct: the product, the price and the code, no filler.",
}
writers = [Agent(name=name, instructions=intro + style, model=MODEL) for name, style in styles.items()]
picker = Agent(name="Promo Picker", model=MODEL, instructions=(
    "You are the editor for a corner store. Pick the one promo the owner should send. "
    "Reply with the chosen message only, nothing else."))

async def main():
    with trace("Promo: ORCHESTRATED BY CODE"):
        results = await asyncio.gather(*(Runner.run(writer, BRIEF) for writer in writers))
        drafts = "\\n\\n".join(result.final_output for result in results)
        best = await Runner.run(picker, f"Brief: {BRIEF}\\n\\nDrafts:\\n{drafts}")
        print(best.final_output)

asyncio.run(main())`,
    ts: `import { Agent, run, withTrace } from '@openai/agents';

const MODEL = 'gpt-5.4-mini';
const BRIEF = JSON.stringify({ name: 'apples', price: 3.0, stock: 30, discount_code: 'SAVE10', discount_percent: 10 });

const intro = 'You are a marketing writer for a small neighbourhood corner store. Write a short promo message. ' +
  'Use only the product, price and discount code in the brief. Never invent prices or offers.\\n';
const styles = {
  'Warm Writer': 'Your style is warm and friendly, like a shopkeeper who knows every customer by name.',
  'Witty Writer': 'Your style is witty and playful, with a light pun. Never mean or over the top.',
  'Direct Writer': 'Your style is short and direct: the product, the price and the code, no filler.',
};
const writers = Object.entries(styles).map(([name, style]) => new Agent({ name, instructions: intro + style, model: MODEL }));
const picker = new Agent({
  name: 'Promo Picker',
  model: MODEL,
  instructions: 'You are the editor for a corner store. Pick the one promo the owner should send. ' +
    'Reply with the chosen message only, nothing else.',
});

await withTrace('Promo: ORCHESTRATED BY CODE', async () => {
  const results = await Promise.all(writers.map((writer) => run(writer, BRIEF)));
  const drafts = results.map((result) => result.finalOutput).join('\\n\\n');
  const best = await run(picker, \`Brief: \${BRIEF}\\n\\nDrafts:\\n\${drafts}\`);
  console.log(best.finalOutput);
});`,
    cs: `using Microsoft.Agents.AI;
using OpenAI.Chat;

const string Brief = """{"name": "apples", "price": 3.0, "stock": 30, "discount_code": "SAVE10", "discount_percent": 10}""";
var chat = new ChatClient("gpt-5.4-mini", Environment.GetEnvironmentVariable("OPENAI_API_KEY")!);

const string Intro = "You are a marketing writer for a small neighbourhood corner store. Write a short promo message. " +
    "Use only the product, price and discount code in the brief. Never invent prices or offers.\\n";
Dictionary<string, string> styles = new()
{
    ["Warm Writer"] = "Your style is warm and friendly, like a shopkeeper who knows every customer by name.",
    ["Witty Writer"] = "Your style is witty and playful, with a light pun. Never mean or over the top.",
    ["Direct Writer"] = "Your style is short and direct: the product, the price and the code, no filler.",
};
AIAgent[] writers = [.. styles.Select(s => chat.AsAIAgent(name: s.Key, instructions: Intro + s.Value))];
AIAgent picker = chat.AsAIAgent(name: "Promo Picker", instructions:
    "You are the editor for a corner store. Pick the one promo the owner should send. " +
    "Reply with the chosen message only, nothing else.");

AgentResponse[] drafts = await Task.WhenAll(writers.Select(writer => writer.RunAsync(Brief)));
AgentResponse best = await picker.RunAsync($"Brief: {Brief}\\n\\nDrafts:\\n{string.Join("\\n\\n", drafts.Select(d => d.Text))}");
Console.WriteLine(best.Text);`,
  },
  c2: {
    py: `# Added to promo.py, which now also imports ModelSettings and function_tool.
@function_tool
def notify_owner(subject: str, text_body: str) -> str:
    """Sends a notification to the store owner.

    Args:
        subject: A short title, such as "Promo ready to send".
        text_body: The promo message as plain text, word for word.
    """
    print(f"[notify] {subject}: {text_body}")
    return "Notification sent"

sender = Agent(
    name="Promo Sender",
    instructions="You assist the store owner. Use notify_owner once to send them the promo you receive, word for word.",
    model=MODEL,
    tools=[notify_owner],
    model_settings=ModelSettings(tool_choice="required"),
)

# Last step of main(), inside the trace:
await Runner.run(sender, best.final_output)`,
    ts: `// Added to promo.ts, which now also imports tool and z (zod).
const notifyOwner = tool({
  name: 'notify_owner',
  description: 'Sends a notification to the store owner.',
  parameters: z.object({
    subject: z.string().describe('A short title, such as "Promo ready to send".'),
    text_body: z.string().describe('The promo message as plain text, word for word.'),
  }),
  execute: ({ subject, text_body }) => {
    console.log(\`[notify] \${subject}: \${text_body}\`);
    return 'Notification sent';
  },
});

const sender = new Agent({
  name: 'Promo Sender',
  instructions: 'You assist the store owner. Use notify_owner once to send them the promo you receive, word for word.',
  model: MODEL,
  tools: [notifyOwner],
  modelSettings: { toolChoice: 'required' },
});

// Last step, inside withTrace:
await run(sender, best.finalOutput ?? '');`,
    cs: `// Added to Promo.cs, with using System.ComponentModel and Microsoft.Extensions.AI.
[Description("Sends a notification to the store owner.")]
static string NotifyOwner(
    [Description("A short title, such as \\"Promo ready to send\\".")] string subject,
    [Description("The promo message as plain text, word for word.")] string textBody)
{
    Console.WriteLine($"[notify] {subject}: {textBody}");
    return "Notification sent";
}

AIAgent sender = chat.AsAIAgent(new ChatClientAgentOptions
{
    Name = "Promo Sender",
    ChatOptions = new()
    {
        Instructions = "You assist the store owner. Use notify_owner once to send them the promo you receive, word for word.",
        Tools = [AIFunctionFactory.Create(NotifyOwner, name: "notify_owner")],
        ToolMode = ChatToolMode.RequireAny,
    },
});
await sender.RunAsync(best.Text);`,
  },
  c3: {
    py: `import asyncio
from agents import Agent, Runner
from store import check_stock, get_price

MODEL = "gpt-5.4-mini"
SHOPKEEPER_PROMPT = ("You are the shopkeeper of a small corner store: friendly, short and polite. "
                     "Never state a price or a stock level yourself; ask your specialists.")

inventory_specialist = Agent(name="Inventory Specialist", model=MODEL, tools=[check_stock], instructions=(
    "Answer only about availability, using check_stock. Reply with the facts only."))
pricing_specialist = Agent(name="Pricing Specialist", model=MODEL, tools=[get_price], instructions=(
    "Answer only about unit prices and totals, using get_price. Reply with the facts only."))

shopkeeper = Agent(name="Shopkeeper", model=MODEL, instructions=SHOPKEEPER_PROMPT, tools=[
    inventory_specialist.as_tool(
        tool_name="inventory_specialist",
        tool_description="Ask whether a product exists and how many units are in stock, e.g. 'Is coffee in stock?'"),
    pricing_specialist.as_tool(
        tool_name="pricing_specialist",
        tool_description="Ask for unit prices and basket totals, e.g. 'Total for 2 coffee'"),
])

async def main():
    result = await Runner.run(shopkeeper, "Do you have coffee, and how much for 2?")
    print(result.final_output)

asyncio.run(main())`,
    ts: `import { Agent, run } from '@openai/agents';
import { checkStock, getPrice } from './store.js';

const MODEL = 'gpt-5.4-mini';
const SHOPKEEPER_PROMPT = 'You are the shopkeeper of a small corner store: friendly, short and polite. ' +
  'Never state a price or a stock level yourself; ask your specialists.';

const inventorySpecialist = new Agent({ name: 'Inventory Specialist', model: MODEL, tools: [checkStock],
  instructions: 'Answer only about availability, using check_stock. Reply with the facts only.' });
const pricingSpecialist = new Agent({ name: 'Pricing Specialist', model: MODEL, tools: [getPrice],
  instructions: 'Answer only about unit prices and totals, using get_price. Reply with the facts only.' });

const shopkeeper = new Agent({ name: 'Shopkeeper', model: MODEL, instructions: SHOPKEEPER_PROMPT, tools: [
  inventorySpecialist.asTool({
    toolName: 'inventory_specialist',
    toolDescription: "Ask whether a product exists and how many units are in stock, e.g. 'Is coffee in stock?'",
  }),
  pricingSpecialist.asTool({
    toolName: 'pricing_specialist',
    toolDescription: "Ask for unit prices and basket totals, e.g. 'Total for 2 coffee'",
  }),
] });

const result = await run(shopkeeper, 'Do you have coffee, and how much for 2?');
console.log(result.finalOutput);`,
    cs: `using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using OpenAI.Chat;

var chat = new ChatClient("gpt-5.4-mini", Environment.GetEnvironmentVariable("OPENAI_API_KEY")!);
const string ShopkeeperPrompt = "You are the shopkeeper of a small corner store: friendly, short and polite. " +
    "Never state a price or a stock level yourself; ask your specialists.";

AIAgent inventorySpecialist = chat.AsAIAgent(name: "Inventory Specialist",
    instructions: "Answer only about availability, using check_stock. Reply with the facts only.",
    tools: [AIFunctionFactory.Create(CheckStock, name: "check_stock")]);
AIAgent pricingSpecialist = chat.AsAIAgent(name: "Pricing Specialist",
    instructions: "Answer only about unit prices and totals, using get_price. Reply with the facts only.",
    tools: [AIFunctionFactory.Create(GetPrice, name: "get_price")]);

AIAgent shopkeeper = chat.AsAIAgent(name: "Shopkeeper", instructions: ShopkeeperPrompt, tools: [
    inventorySpecialist.AsAIFunction(new() { Name = "inventory_specialist",
        Description = "Ask whether a product exists and how many units are in stock, e.g. 'Is coffee in stock?'" }),
    pricingSpecialist.AsAIFunction(new() { Name = "pricing_specialist",
        Description = "Ask for unit prices and basket totals, e.g. 'Total for 2 coffee'" }),
]);

Console.WriteLine(await shopkeeper.RunAsync("Do you have coffee, and how much for 2?"));`,
  },
  c4: {
    py: `# Added to shop.py, which now also imports TResponseInputItem, function_tool,
# BaseModel and INVENTORY. main() replaces the earlier one.
class ProductItem(BaseModel):
    product_name: str
    quantity: int

next_order = 1001

@function_tool
def place_order(items: list[ProductItem]) -> str:
    """Places the order, lowers the stock and returns the order number and the units left."""
    global next_order
    for item in items:
        INVENTORY[item.product_name]["stock"] -= item.quantity
    left = ", ".join(f"{item.product_name} {INVENTORY[item.product_name]['stock']}" for item in items)
    next_order += 1
    return f"Order {next_order - 1} placed. Left in stock: {left}"

checkout_agent = Agent(name="Checkout Agent", model=MODEL, tools=[place_order], instructions=(
    "Confirm the basket, place the order with place_order and give the customer the order number."))
store_shopkeeper = shopkeeper.clone(handoffs=[checkout_agent], instructions=SHOPKEEPER_PROMPT + (
    " Hand off to the Checkout Agent only when the customer clearly says they want to buy."))

memory: list[TResponseInputItem] = []

async def chat(text: str) -> None:
    global memory
    memory.append({"role": "user", "content": text})
    result = await Runner.run(store_shopkeeper, memory)  # always start at the Shopkeeper
    print(f"{result.last_agent.name}: {result.final_output}")
    memory = result.to_input_list()

async def main():
    await chat("I'll take 1 coffee, please.")
    await chat("Is milk in stock?")

asyncio.run(main())`,
    ts: `// Added to shop.ts, which now also imports tool, user, AgentInputItem, z and INVENTORY.
// The two chat() calls replace the earlier run.
let nextOrder = 1001;
const placeOrder = tool({
  name: 'place_order',
  description: 'Places the order, lowers the stock and returns the order number and the units left.',
  parameters: z.object({ items: z.array(z.object({ product_name: z.string(), quantity: z.number().int() })) }),
  execute: ({ items }) => {
    for (const { product_name, quantity } of items) INVENTORY[product_name]!.stock -= quantity;
    const left = items.map(({ product_name }) => \`\${product_name} \${INVENTORY[product_name]!.stock}\`).join(', ');
    return \`Order \${nextOrder++} placed. Left in stock: \${left}\`;
  },
});

const checkoutAgent = new Agent({ name: 'Checkout Agent', model: MODEL, tools: [placeOrder],
  instructions: 'Confirm the basket, place the order with place_order and give the customer the order number.' });
const storeShopkeeper = shopkeeper.clone({ handoffs: [checkoutAgent], instructions: SHOPKEEPER_PROMPT +
  ' Hand off to the Checkout Agent only when the customer clearly says they want to buy.' });

let memory: AgentInputItem[] = [];

async function chat(text: string) {
  memory.push(user(text));
  const result = await run(storeShopkeeper, memory); // always start at the Shopkeeper
  console.log(\`\${result.lastAgent?.name}: \${result.finalOutput}\`);
  memory = result.history;
}

await chat("I'll take 1 coffee, please.");
await chat('Is milk in stock?');`,
    cs: `// Added to Shop.cs, with using System.ComponentModel and Microsoft.Agents.AI.Workflows,
// and ChatMessage aliased to Microsoft.Extensions.AI.ChatMessage. Chat() replaces the earlier run.
int nextOrder = 1001;
[Description("Places the order, lowers the stock and returns the order number and the units left.")]
string PlaceOrder(ProductItem[] items)
{
    foreach (var item in items) Inventory[item.ProductName].Stock -= item.Quantity;
    var left = string.Join(", ", items.Select(i => $"{i.ProductName} {Inventory[i.ProductName].Stock}"));
    return $"Order {nextOrder++} placed. Left in stock: {left}";
}

AIAgent checkoutAgent = chat.AsAIAgent(name: "Checkout Agent",
    instructions: "Confirm the basket, place the order with place_order and give the customer the order number.",
    tools: [AIFunctionFactory.Create(PlaceOrder, name: "place_order")]);

Workflow workflow = AgentWorkflowBuilder.CreateHandoffBuilderWith(shopkeeper)
    .WithHandoff(shopkeeper, checkoutAgent, "Hand off only when the customer clearly says they want to buy.")
    .Build();

List<ChatMessage> history = [];
async Task Chat(string text)
{
    history.Add(new(ChatRole.User, text));
    await using StreamingRun run = await InProcessExecution.RunStreamingAsync(workflow, history);
    await run.TrySendMessageAsync(new TurnToken());
    await foreach (WorkflowEvent evt in run.WatchStreamAsync())
        if (evt is WorkflowOutputEvent { Data: List<ChatMessage> messages }) history = messages;
    Console.WriteLine($"{history[^1].AuthorName}: {history[^1].Text}");
}

await Chat("I'll take 1 coffee, please.");
await Chat("Is milk in stock?");

record ProductItem(string ProductName, int Quantity);`,
  },
};
