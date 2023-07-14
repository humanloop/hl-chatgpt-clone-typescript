import { Humanloop, ChatMessage } from "humanloop";

if (!process.env.HUMANLOOP_API_KEY) {
  throw new Error(
    "no Humanloop API key provided; add one to your .env.local file with: `HUMANLOOP_API_KEY=..."
  );
}

const humanloop = new Humanloop({
  apiKey: process.env.HUMANLOOP_API_KEY,
});

export async function POST(req: Request): Promise<Response> {
  const messages: ChatMessage[] = (await req.json()) as ChatMessage[];

  const response = await humanloop.chatDeployedStream({
    project: "chat-tutorial-ts",
    messages,
  });

  return new Response(response.data);
}
