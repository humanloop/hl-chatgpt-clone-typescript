import { HumanloopClient } from "humanloop";
import { readableStreamAsyncIterable } from "humanloop/core/streaming-fetcher/Stream";

if (!process.env.HUMANLOOP_API_KEY) {
  throw Error(
    "no Humanloop API key provided; add one to your .env.local file with: `HUMANLOOP_API_KEY=..."
  );
}

const humanloop = new HumanloopClient({
  environment: "https://api.humanloop.com/v5",
  apiKey: process.env.HUMANLOOP_API_KEY,
});

export async function POST(req: Request): Promise<Response> {
  const messages = await req.json();

  const response = await humanloop.prompts.callStream({
    path: "customer-support-agent",
    messages,
    // This is the name of your company. You can change it to any string you like.
    // It matches the companyName input defined in the Prompt Version template.
    inputs: {
      companyName: "Acme Co.",
    },
    providerApiKeys: {
      openai: process.env.OPENAI_API_KEY,
    },
  });

  const stream = readableStreamAsyncIterable(response);

  // Create a ReadableStream from the async iterable
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          // Serialize the chunk to a string
          const serializedChunk = JSON.stringify(chunk);
          // Enqueue the serialized chunk as a Uint8Array
          controller.enqueue(new TextEncoder().encode(serializedChunk));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readableStream, {
    headers: { "Content-Type": "application/json" },
  });
}
