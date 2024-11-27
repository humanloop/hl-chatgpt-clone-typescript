import { readableStreamAsyncIterable } from "humanloop/core/streaming-fetcher/Stream";
import { humanloop } from "../humanloop_client";

export const PROMPT_HUMANLOOP_PATH =
  "chatgpt-clone-tutorial/customer-support-agent";

export async function POST(req: Request): Promise<Response> {
  const messages = await req.json();

  const response = await humanloop.prompts.callStream({
    path: PROMPT_HUMANLOOP_PATH,
    prompt: {
      model: "gpt-4",
      template: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
      ],
    },
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
          // Add a newline delimiter between chunks
          const serializedChunk = JSON.stringify(chunk) + "\n";
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
